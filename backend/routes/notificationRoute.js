import express from 'express';
import PushSubscription from '../models/pushSubscriptionModel.js';
import auth from '../middleware/auth.js';
import webpush from 'web-push';

const router = express.Router();

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Subscribe user to push notifications
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { subscription, userId } = req.body;

    // Save subscription to database
    await PushSubscription.findOneAndUpdate(
      { userId: req.user.id },
      { subscription, userId: req.user.id },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Subscription saved' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ success: false, message: 'Error saving subscription' });
  }
});

// Send notification for order status change
router.post('/notify-order-status', async (req, res) => {
  try {
    const { userId, orderId, status, items } = req.body;
    
    console.log(`📬 [NOTIFICATION DEBUG] Attempting to send notification:`);
    console.log(`   UserId: ${userId}`);
    console.log(`   OrderId: ${orderId}`);
    console.log(`   Status: ${status}`);
    console.log(`   Status Type: ${typeof status}`);

    // Get user's subscription
    const subData = await PushSubscription.findOne({ userId });

    if (!subData) {
      console.log(`⚠️ [NOTIFICATION DEBUG] No subscription found for userId: ${userId}`);
      return res.json({ success: false, message: 'No subscription found' });
    }

    if (!subData.subscription) {
      console.log(`⚠️ [NOTIFICATION DEBUG] Subscription object is empty for userId: ${userId}`);
      return res.json({ success: false, message: 'Subscription empty' });
    }

    console.log(`✅ [NOTIFICATION DEBUG] Subscription found for user: ${userId}`);

    // ✅ Status mapping - all possible statuses
    const notificationTitles = {
      'En préparation': '🍳 Commande en préparation',
      'Livraison': '🚗 Commande en livraison',
      'Livrée': '✅ Commande livrée',
      'Cancelled': '❌ Commande annulée',
      'Payment Failed': '❌ Paiement échoué',
      'Refunded': '💸 Commande remboursée'
    };

    const notificationBodies = {
      'En préparation': 'Votre commande est en cours de préparation. À bientôt!',
      'Livraison': 'Votre commande est en route. Elle arrive bientôt!',
      'Livrée': 'Votre commande a été livrée. Merci!',
      'Cancelled': 'Votre commande a été annulée.',
      'Payment Failed': 'Le paiement de votre commande a échoué.',
      'Refunded': 'Votre commande a été remboursée.'
    };

    const payloadTitle = notificationTitles[status] || `Statut: ${status}`;
    const payloadBody = notificationBodies[status] || 'Cliquez pour voir les détails';

    console.log(`📝 [NOTIFICATION DEBUG] Using title: "${payloadTitle}"`);
    console.log(`📝 [NOTIFICATION DEBUG] Using body: "${payloadBody}"`);

    const payload = JSON.stringify({
      title: payloadTitle,
      body: payloadBody,
      icon: '/logo.png',
      badge: '/logo-small.png',
      tag: `order-${orderId}`,
      data: {
        orderId,
        status,
        itemsCount: items?.length || 0,
        url: '/myorders'
      }
    });

    // Send notification
    await webpush.sendNotification(subData.subscription, payload);

    console.log(`✅ [NOTIFICATION SUCCESS] Push sent to ${userId} | Order: ${orderId} | Status: ${status}`);
    res.json({ success: true, message: 'Notification sent', status: status });
    
  } catch (error) {
    console.error(`❌ [NOTIFICATION ERROR] Failed to send:`, error.message);
    console.error(`Error details:`, error);
    
    // Handle subscription expired error
    if (error.statusCode === 410) {
      console.log(`🗑️ [NOTIFICATION DEBUG] Subscription expired (410), removing for userId: ${req.body.userId}`);
      await PushSubscription.deleteOne({ userId: req.body.userId });
    }

    res.status(500).json({ success: false, message: 'Error sending notification', error: error.message });
  }
});

// Debug: List all subscriptions (for testing)
router.get('/debug/subscriptions', async (req, res) => {
  try {
    const subs = await PushSubscription.find({}).select('userId createdAt updatedAt');
    console.log(`📊 Total subscriptions: ${subs.length}`);
    res.json({ success: true, subscriptions: subs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching subscriptions' });
  }
});

// Unsubscribe user
router.post('/unsubscribe', auth, async (req, res) => {
  try {
    await PushSubscription.deleteOne({ userId: req.user.id });
    res.json({ success: true, message: 'Unsubscribed' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ success: false, message: 'Error unsubscribing' });
  }
});

// Temporary test route to send a push notification
router.post('/test', async (req, res) => {
  try {
    const { subscription, userId } = req.body;

    if (!subscription) {
      return res.status(400).json({ success: false, message: 'Subscription required' });
    }

    const payload = JSON.stringify({
      title: '🔔 Test Notification',
      body: 'This is a test push notification from your backend!',
      icon: '/logo.png',
      badge: '/logo-small.png',
      tag: 'test-notification',
      data: { url: '/myorders' }
    });

    await webpush.sendNotification(subscription, payload);

    console.log(`✅ Test notification sent to userId: ${userId}`);
    res.json({ success: true, message: 'Test notification sent!' });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ success: false, message: 'Failed to send test notification' });
  }
});

export default router;