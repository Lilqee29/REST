import express from 'express';
import PushSubscription from '../models/pushSubscriptionModel.js';
import auth from '../middleware/auth.js';
import webpush from 'web-push';

const router = express.Router();

// 🔧 Configure web-push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/* ========================================================
   🟢 1️⃣ SUBSCRIBE: Save new device subscription
======================================================== */
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint)
      return res.status(400).json({ success: false, message: 'Invalid subscription' });

    // ✅ Use findOneAndUpdate with upsert to handle duplicates gracefully
    await PushSubscription.findOneAndUpdate(
      {
        userId: req.user.id,
        'subscription.endpoint': subscription.endpoint,
      },
      {
        $set: {
          userId: req.user.id,
          subscription: subscription,
          lastActiveAt: new Date(),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        }
      },
      {
        upsert: true, // Create if doesn't exist
        new: true,
        runValidators: true,
      }
    );

    console.log(`✅ Subscription saved/updated for user ${req.user.id}`);
    res.json({ success: true, message: 'Subscription saved successfully' });
  } catch (err) {
    console.error('❌ Error saving subscription:', err);
    
    // Handle duplicate key errors gracefully
    if (err.code === 11000) {
      console.log('⚠️ Duplicate subscription detected, treating as success');
      return res.json({ success: true, message: 'Subscription already exists' });
    }
    
    res.status(500).json({ success: false, message: 'Error saving subscription' });
  }
});


/* ========================================================
   🟡 2️⃣ NOTIFY ORDER STATUS: Send to all user devices
======================================================== */
router.post('/notify-order-status', async (req, res) => {
  try {
    const { userId, orderId, status, items } = req.body;

    // ✅ Remove stale subscriptions older than 60 days
    const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    await PushSubscription.deleteMany({ lastActiveAt: { $lt: cutoff } });

    const subscriptions = await PushSubscription.find({ userId });
    if (!subscriptions.length)
      return res.json({ success: false, message: 'No subscriptions found' });

    const statusConfigs = {
      'En préparation': { title: '🍳 Commande en préparation', body: 'Votre commande est en cours de préparation.', vibrate: [200, 100, 200] },
      'Livraison': { title: '🚗 Commande en livraison', body: 'Votre commande est en route.', vibrate: [300, 100, 300] },
      'Livrée': { title: '✅ Commande livrée', body: 'Votre commande a été livrée.', vibrate: [200, 50, 200, 50, 200] },
      'Cancelled': { title: '❌ Commande annulée', body: 'Votre commande a été annulée.', vibrate: [500, 100, 500] },
      'Payment Failed': { title: '❌ Paiement échoué', body: 'Le paiement a échoué.', vibrate: [500, 100, 500] },
      'Refunded': { title: '💸 Commande remboursée', body: 'Votre commande a été remboursée.', vibrate: [200, 100, 200] }
    };

    const config = statusConfigs[status] || { title: '📦 Statut de commande', body: `Commande: ${status}`, vibrate: [200, 100, 200] };

    const payload = JSON.stringify({
      title: config.title,
      body: config.body,
      icon: '/logo.png',
      badge: '/logo-small.png',
      tag: `order-${orderId}-${status}-${Date.now()}`,
      requiresInteraction: true,
      vibrate: config.vibrate,
      timestamp: Date.now(),
      priority: 'high',
      actions: [{ action: 'view-order', title: 'Voir la commande' }, { action: 'close', title: 'Fermer' }],
      data: { orderId, status, itemsCount: items?.length || 0, url: '/myorders' }
    });

    let successCount = 0;
    let failCount = 0;

    // 🔁 Send notifications
    await Promise.all(subscriptions.map(async subData => {
      try {
        await webpush.sendNotification(subData.subscription, payload);
        console.log(`✅ Notification sent to ${subData.subscription.endpoint.slice(-20)}`);

        // ✅ Refresh lastActiveAt after successful send
        await PushSubscription.updateOne(
          { _id: subData._id },
          { $set: { lastActiveAt: new Date() } }
        );
        successCount++;

      } catch (err) {
        console.error(`❌ Failed for ${subData.subscription.endpoint.slice(-20)}:`, err.message);
        failCount++;

        // Remove expired/unsubscribed endpoints (410 = Gone)
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.deleteOne({ _id: subData._id });
          console.log(`🗑️ Removed invalid subscription: ${subData.subscription.endpoint.slice(-20)}`);
        }
      }
    }));

    console.log(`📊 Sent: ${successCount}, Failed: ${failCount}`);
    res.json({ 
      success: true, 
      message: `Notifications sent: ${successCount} succeeded, ${failCount} failed`,
      stats: { successCount, failCount, total: subscriptions.length }
    });
  } catch (err) {
    console.error('❌ Error sending notifications:', err.message);
    res.status(500).json({ success: false, message: 'Error sending notification', error: err.message });
  }
});


/* ========================================================
   🔴 3️⃣ UNSUBSCRIBE: Remove only the current device
======================================================== */
router.post('/unsubscribe', auth, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ success: false, message: 'Endpoint is required' });

    const result = await PushSubscription.deleteOne({ 
      userId: req.user.id, 
      'subscription.endpoint': endpoint 
    });
    
    console.log(`🗑️ Unsubscribe result: ${result.deletedCount} subscription(s) removed`);
    res.json({ success: true, message: 'Device unsubscribed successfully' });
  } catch (err) {
    console.error('❌ Error unsubscribing:', err);
    res.status(500).json({ success: false, message: 'Error unsubscribing device' });
  }
});

/* ========================================================
   🔵 4️⃣ CLEANUP: Remove all stale subscriptions for user
======================================================== */
router.post('/cleanup-subscriptions', auth, async (req, res) => {
  try {
    // Remove subscriptions older than 7 days for this user
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await PushSubscription.deleteMany({ 
      userId: req.user.id,
      lastActiveAt: { $lt: cutoff }
    });
    
    console.log(`🧹 Cleaned up ${result.deletedCount} stale subscriptions for user ${req.user.id}`);
    res.json({ 
      success: true, 
      message: `Removed ${result.deletedCount} inactive subscriptions` 
    });
  } catch (err) {
    console.error('❌ Error cleaning subscriptions:', err);
    res.status(500).json({ success: false, message: 'Error cleaning subscriptions' });
  }
});

/* ========================================================
   🧪 5️⃣ TEST: Send a sample notification manually
======================================================== */
router.post('/test', async (req, res) => {
  try {
    const { subscription, userId } = req.body;
    if (!subscription) return res.status(400).json({ success: false, message: 'Subscription required' });

    const payload = JSON.stringify({
      title: '🔔 Test Notification',
      body: 'This is a test push notification!',
      icon: '/logo.png',
      badge: '/logo-small.png',
      tag: `test-${Date.now()}`,
      requiresInteraction: true,
      vibrate: [200, 100, 200],
      priority: 'high',
      data: { url: '/myorders' }
    });

    await webpush.sendNotification(subscription, payload);
    console.log(`✅ Test notification sent to userId: ${userId}`);
    res.json({ success: true, message: 'Test notification sent!' });
  } catch (err) {
    console.error('❌ Error sending test notification:', err);
    res.status(500).json({ success: false, message: 'Failed to send test notification' });
  }
});

export default router;
