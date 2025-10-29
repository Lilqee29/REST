import { useEffect, useContext, useState } from 'react';
import NotificationService from '../utils/notificationService';
import { StoreContext } from '../context/StoreContext';

export const useNotifications = () => {
  const { token, userId } = useContext(StoreContext);

  const [notificationStatus, setNotificationStatus] = useState({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    error: null
  });

  useEffect(() => {
    if (!token || !userId) {
      console.log('⚠️ No token or userId, skipping notifications');
      return;
    }

    const initNotifications = async () => {
      try {
        // 1️⃣ Check device support
        if (!NotificationService.isSupported) {
          setNotificationStatus({ ...notificationStatus, error: 'Notifications not supported', isSupported: false });
          return;
        }

        // 2️⃣ Register service worker
        const registration = await NotificationService.registerServiceWorker();
        if (!registration) throw new Error('Failed to register service worker');

        // Small delay for iOS to ensure SW is fully active
        if (NotificationService.isIOS) await new Promise(res => setTimeout(res, 1000));

        // 3️⃣ Check existing subscription
        const status = await NotificationService.getSubscriptionStatus();

        if (status?.isSubscribed) {
          console.log('✅ Already subscribed');
          setNotificationStatus({
            isSupported: true,
            isSubscribed: true,
            permission: status.permission || 'granted',
            error: null
          });
          return;
        }

        // 4️⃣ Request permission if not granted/denied
        if (Notification.permission === 'default') {
          const permissionGranted = await NotificationService.requestPermission();
          if (!permissionGranted) {
            setNotificationStatus({
              isSupported: true,
              isSubscribed: false,
              permission: Notification.permission,
              error: 'Permission denied'
            });
            return;
          }
        }

        // 5️⃣ Subscribe to push notifications
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidKey) throw new Error('VAPID key not found');

        const subscribed = await NotificationService.subscribe(vapidKey, userId, token);
        if (!subscribed) throw new Error('Subscription failed');

        setNotificationStatus({ isSupported: true, isSubscribed: true, permission: 'granted', error: null });

        // Show test notification on iOS
        if (NotificationService.isIOS) {
          setTimeout(() => NotificationService.showTestNotification().catch(console.warn), 1000);
        }

      } catch (error) {
        console.error('❌ Notifications initialization error:', error);
        setNotificationStatus({
          isSupported: NotificationService?.isSupported || false,
          isSubscribed: false,
          permission: Notification.permission || 'default',
          error: error.message
        });
      }
    };

    initNotifications();
  }, [token, userId]);

  return {
    ...notificationStatus,
    showNotification: NotificationService?.showTestNotification?.bind(NotificationService) || (() => {}),
    getStatus: NotificationService?.getSubscriptionStatus?.bind(NotificationService) || (() => null)
  };
};
