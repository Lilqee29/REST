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
    
    console.log(`📬 Sending notification | Status: ${status} | Order: ${orderId}`);

    const subData = await PushSubscription.findOne({ userId });

    if (!subData || !subData.subscription) {
      console.log(`⚠️ No subscription found for userId: ${userId}`);
      return res.json({ success: false, message: 'No subscription found' });
    }

    // ✅ Status configuration with emojis
    const statusConfigs = {
      'En préparation': {
        title: '🍳 Commande en préparation',
        body: 'Votre commande est en cours de préparation. À bientôt!',
        vibrate: [200, 100, 200]
      },
      'Livraison': {
        title: '🚗 Commande en livraison',
        body: 'Votre commande est en route. Elle arrive bientôt!',
        vibrate: [300, 100, 300]
      },
      'Livrée': {
        title: '✅ Commande livrée',
        body: 'Votre commande a été livrée. Merci!',
        vibrate: [200, 50, 200, 50, 200]
      },
      'Cancelled': {
        title: '❌ Commande annulée',
        body: 'Votre commande a été annulée.',
        vibrate: [500, 100, 500]
      },
      'Payment Failed': {
        title: '❌ Paiement échoué',
        body: 'Le paiement de votre commande a échoué.',
        vibrate: [500, 100, 500]
      },
      'Refunded': {
        title: '💸 Commande remboursée',
        body: 'Votre commande a été remboursée.',
        vibrate: [200, 100, 200]
      }
    };

    const config = statusConfigs[status] || {
      title: 'Statut de commande',
      body: `Votre commande: ${status}`,
      vibrate: [200, 100, 200]
    };

    // ✅ Create unique tag to prevent replacement
    const timestamp = Date.now();
    const uniqueTag = `order-${orderId}-${status}-${timestamp}`;

    const payload = JSON.stringify({
      title: config.title,
      body: config.body,
      icon: '/logo.png',
      badge: '/logo-small.png',
      tag: uniqueTag,  // ✅ Unique tag so notifications aren't replaced
      requiresInteraction: true,
      vibrate: config.vibrate,  // ✅ Add vibration
      timestamp: Date.now(),
      priority: 'high',  // ✅ Force high priority
      actions: [
        {
          action: 'view-order',
          title: 'Voir la commande'
        },
        {
          action: 'close',
          title: 'Fermer'
        }
      ],
      data: {
        orderId,
        status,
        itemsCount: items?.length || 0,
        url: '/myorders',
        timestamp: Date.now()
      }
    });

    await webpush.sendNotification(subData.subscription, payload);

    console.log(`✅ Notification sent successfully | Status: ${status} | UserId: ${userId}`);
    res.json({ success: true, message: 'Notification sent', status });
    
  } catch (error) {
    console.error(`❌ Error sending notification:`, error.message);
    
    if (error.statusCode === 410) {
      console.log(`🗑️ Subscription expired, removing...`);
      await PushSubscription.deleteOne({ userId: req.body.userId });
    }

    res.status(500).json({ success: false, message: 'Error sending notification', error: error.message });
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

// Test route to verify notifications work
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