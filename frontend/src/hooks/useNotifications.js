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
    // Early return if no user or notification service unavailable
    if (!token || !userId) {
      console.log('⚠️ No token or userId, skipping notifications');
      return;
    }

    // Wrap everything in try-catch to prevent crashes
    const initializeNotifications = async () => {
      try {
        console.log('🔔 Initializing notifications...');

        // Check if NotificationService exists and is supported
        if (!NotificationService || !NotificationService.isSupported) {
          console.warn('⚠️ Notifications not supported on this device');
          setNotificationStatus({
            isSupported: false,
            isSubscribed: false,
            permission: 'default',
            error: 'Not supported on this device'
          });
          return;
        }

        console.log('📱 Device info:', {
          isIOS: NotificationService.isIOS,
          isStandalone: typeof window !== 'undefined' && 
            (window.navigator?.standalone || window.matchMedia('(display-mode: standalone)').matches),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
        });

        // 1️⃣ Register service worker
        const registration = await NotificationService.registerServiceWorker();
        if (!registration) {
          throw new Error('Failed to register service worker');
        }

        // 2️⃣ Wait for service worker to be ready
        if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
          await navigator.serviceWorker.ready;
          console.log('✅ Service worker is ready');
        }

        // Small delay for iOS to ensure SW is fully active
        if (NotificationService.isIOS) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 3️⃣ Check current subscription status
        const status = await NotificationService.getSubscriptionStatus();
        console.log('📊 Current status:', status);

        if (status?.isSubscribed) {
          console.log('✅ Already subscribed to push notifications');
          setNotificationStatus({
            isSupported: true,
            isSubscribed: true,
            permission: status.permission || 'granted',
            error: null
          });
          return;
        }

        // 4️⃣ Request permission (only if not already granted/denied)
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
          const permission = await NotificationService.requestPermission();
          if (!permission) {
            console.warn('⚠️ Notification permission denied');
            setNotificationStatus({
              isSupported: true,
              isSubscribed: false,
              permission: Notification.permission,
              error: 'Permission denied'
            });
            return;
          }
        }

        // 5️⃣ Get VAPID key
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          throw new Error('VAPID key not found');
        }

        // 6️⃣ Subscribe to push notifications
        const subscribed = await NotificationService.subscribe(vapidKey, userId, token);
        
        if (subscribed) {
          console.log('✅ Notifications enabled successfully!');
          setNotificationStatus({
            isSupported: true,
            isSubscribed: true,
            permission: 'granted',
            error: null
          });

          // Show test notification on iOS
          if (NotificationService.isIOS) {
            setTimeout(() => {
              NotificationService.showTestNotification().catch(err => {
                console.warn('Test notification failed:', err);
              });
            }, 1000);
          }
        } else {
          throw new Error('Subscription failed');
        }

      } catch (error) {
        console.error('❌ Error initializing notifications:', error);
        setNotificationStatus({
          isSupported: NotificationService?.isSupported || false,
          isSubscribed: false,
          permission: typeof Notification !== 'undefined' ? Notification.permission : 'default',
          error: error.message
        });
      }
    };

    initializeNotifications();
  }, [token, userId]);

  return {
    ...notificationStatus,
    showNotification: NotificationService?.showTestNotification?.bind(NotificationService) || (() => {}),
    getStatus: NotificationService?.getSubscriptionStatus?.bind(NotificationService) || (() => null)
  };
};