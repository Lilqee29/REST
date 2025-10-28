import express from 'express';
import PushSubscription from '../models/pushSubscriptionModel.js';
import auth from '../middleware/auth.js';
import webpush from 'web-push';

const router = express.Router();

// 🔧 Configure web-push with your VAPID keys
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

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: 'Invalid subscription data' });
    }

    // Check if this exact device is already saved
    const existing = await PushSubscription.findOne({
      userId: req.user.id,
      'subscription.endpoint': subscription.endpoint,
    });

    if (!existing) {
      await PushSubscription.create({
        userId: req.user.id,
        subscription,
      });
      console.log(`✅ New subscription saved for user ${req.user.id}`);
    } else {
      console.log(`ℹ️ Subscription already exists for this endpoint`);
    }

    res.json({ success: true, message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('❌ Error saving subscription:', error);
    res.status(500).json({ success: false, message: 'Error saving subscription' });
  }
});

/* ========================================================
   🟡 2️⃣ NOTIFY ORDER STATUS: Send to all user devices
======================================================== */
router.post('/notify-order-status', async (req, res) => {
  try {
    const { userId, orderId, status, items } = req.body;

    console.log(`📬 Sending notification | User: ${userId} | Status: ${status}`);

    const subscriptions = await PushSubscription.find({ userId });

    if (!subscriptions.length) {
      console.log(`⚠️ No subscriptions found for userId: ${userId}`);
      return res.json({ success: false, message: 'No subscription found' });
    }

    // 🧩 Notification text templates
    const statusConfigs = {
      'En préparation': {
        title: '🍳 Commande en préparation',
        body: 'Votre commande est en cours de préparation. À bientôt!',
        vibrate: [200, 100, 200],
      },
      'Livraison': {
        title: '🚗 Commande en livraison',
        body: 'Votre commande est en route. Elle arrive bientôt!',
        vibrate: [300, 100, 300],
      },
      'Livrée': {
        title: '✅ Commande livrée',
        body: 'Votre commande a été livrée. Merci!',
        vibrate: [200, 50, 200, 50, 200],
      },
      'Cancelled': {
        title: '❌ Commande annulée',
        body: 'Votre commande a été annulée.',
        vibrate: [500, 100, 500],
      },
      'Payment Failed': {
        title: '❌ Paiement échoué',
        body: 'Le paiement de votre commande a échoué.',
        vibrate: [500, 100, 500],
      },
      'Refunded': {
        title: '💸 Commande remboursée',
        body: 'Votre commande a été remboursée.',
        vibrate: [200, 100, 200],
      },
    };

    const config = statusConfigs[status] || {
      title: '📦 Statut de commande',
      body: `Votre commande: ${status}`,
      vibrate: [200, 100, 200],
    };

    // 🧠 Build the notification payload
    const payload = JSON.stringify({
      title: config.title,
      body: config.body,
      icon: '/logo.png',
      badge: '/logo-small.png',
      tag: `order-${orderId}-${status}-${Date.now()}`, // unique
      requiresInteraction: true,
      vibrate: config.vibrate,
      timestamp: Date.now(),
      priority: 'high',
      actions: [
        { action: 'view-order', title: 'Voir la commande' },
        { action: 'close', title: 'Fermer' },
      ],
      data: {
        orderId,
        status,
        itemsCount: items?.length || 0,
        url: '/myorders',
      },
    });

    // 🔁 Send notification to all devices
    for (const subData of subscriptions) {
      try {
        await webpush.sendNotification(subData.subscription, payload);
        console.log(`✅ Notification sent to ${subData.subscription.endpoint}`);
      } catch (err) {
        console.error(`❌ Failed for ${subData.subscription.endpoint}:`, err.message);
        // Remove expired subscriptions
        if (err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: subData._id });
          console.log('🗑️ Removed expired subscription');
        }
      }
    }

    res.json({ success: true, message: 'Notification sent to all devices' });
  } catch (error) {
    console.error(`❌ Error sending notifications:`, error.message);
    res.status(500).json({ success: false, message: 'Error sending notification', error: error.message });
  }
});

/* ========================================================
   🔴 3️⃣ UNSUBSCRIBE: Remove only the current device
======================================================== */
router.post('/unsubscribe', auth, async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ success: false, message: 'Endpoint is required' });
    }

    await PushSubscription.deleteOne({
      userId: req.user.id,
      'subscription.endpoint': endpoint,
    });

    res.json({ success: true, message: 'Device unsubscribed successfully' });
  } catch (error) {
    console.error('❌ Error unsubscribing:', error);
    res.status(500).json({ success: false, message: 'Error unsubscribing device' });
  }
});

/* ========================================================
   🧪 4️⃣ TEST: Send a sample notification manually
======================================================== */
router.post('/test', async (req, res) => {
  try {
    const { subscription, userId } = req.body;

    if (!subscription) {
      return res.status(400).json({ success: false, message: 'Subscription required' });
    }

    const payload = JSON.stringify({
      title: '🔔 Test Notification',
      body: 'This is a test push notification!',
      icon: '/logo.png',
      badge: '/logo-small.png',
      tag: `test-${Date.now()}`,
      requiresInteraction: true,
      vibrate: [200, 100, 200],
      priority: 'high',
      data: { url: '/myorders' },
    });

    await webpush.sendNotification(subscription, payload);
    console.log(`✅ Test notification sent to userId: ${userId}`);

    res.json({ success: true, message: 'Test notification sent!' });
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
    res.status(500).json({ success: false, message: 'Failed to send test notification' });
  }
});

export default router;
