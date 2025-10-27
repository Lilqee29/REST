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

    // Get user's subscription
    const subData = await PushSubscription.findOne({ userId });

    if (!subData || !subData.subscription) {
      return res.json({ success: false, message: 'No subscription found' });
    }

    // Determine notification content based on status
    const notificationTitles = {
      'Food Processing': '🍳 Commande en préparation',
      'Out for delivery': '🚗 Commande en livraison',
      'Delivered': '✅ Commande livrée',
      'Cancelled': '❌ Commande annulée'
    };

    const notificationBodies = {
      'Food Processing': 'Votre commande est en cours de préparation. À bientôt!',
      'Out for delivery': 'Votre commande est en route. Elle arrive bientôt!',
      'Delivered': 'Votre commande a été livrée. Merci!',
      'Cancelled': 'Votre commande a été annulée.'
    };

    const payloadTitle = notificationTitles[status] || 'Statut de commande mis à jour';
    const payloadBody = notificationBodies[status] || 'Cliquez pour voir les détails';

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

    console.log(`✅ Push notification sent to ${userId} for order ${orderId}`);
    res.json({ success: true, message: 'Notification sent' });
  } catch (error) {
    console.error('Error sending notification:', error);
    
    // Handle subscription expired error
    if (error.statusCode === 410) {
      await PushSubscription.deleteOne({ userId: req.body.userId });
    }

    res.status(500).json({ success: false, message: 'Error sending notification' });
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

export default router;

