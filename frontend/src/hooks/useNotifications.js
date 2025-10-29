import { useEffect, useContext, useState, useRef } from 'react';
import NotificationService from '../utils/notificationService';
import { StoreContext } from '../context/StoreContext';

export const useNotifications = () => {
  const { token, userId } = useContext(StoreContext);
  const hasInitialized = useRef(false); // ✅ Prevent duplicate runs

  const [notificationStatus, setNotificationStatus] = useState({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    error: null
  });

  useEffect(() => {
    // ✅ Skip if already initialized or no credentials
    if (hasInitialized.current || !token || !userId) {
      if (!token || !userId) console.log('⚠️ No token or userId, skipping notifications');
      return;
    }

    hasInitialized.current = true; // Mark as initialized

    const initNotifications = async () => {
      try {
        // 1️⃣ Check device support
        if (!NotificationService.isSupported) {
          setNotificationStatus({ 
            isSupported: false,
            isSubscribed: false,
            permission: 'default',
            error: 'Notifications not supported'
          });
          return;
        }

        // 2️⃣ Register service worker
        const registration = await NotificationService.registerServiceWorker();
        if (!registration) throw new Error('Failed to register service worker');

        // Small delay for iOS to ensure SW is fully active
        if (NotificationService.isIOS) await new Promise(res => setTimeout(res, 1000));

        // 3️⃣ Check if this is a fresh install (no localStorage flag)
        const isReinstall = !localStorage.getItem('pwa_installed');
        if (isReinstall) {
          console.log('🆕 Fresh PWA install detected, will create new subscription');
          localStorage.setItem('pwa_installed', 'true');
          localStorage.setItem('pwa_install_time', Date.now().toString());
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
        } else if (Notification.permission === 'denied') {
          setNotificationStatus({
            isSupported: true,
            isSubscribed: false,
            permission: 'denied',
            error: 'Permission denied'
          });
          return;
        }

        // 5️⃣ Subscribe to push notifications (force new if reinstall)
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidKey) throw new Error('VAPID key not found');

        const subscribed = await NotificationService.subscribe(vapidKey, userId, token, isReinstall);
        if (!subscribed) throw new Error('Subscription failed');

        setNotificationStatus({ 
          isSupported: true, 
          isSubscribed: true, 
          permission: 'granted', 
          error: null 
        });

        // ✅ Show test notification ONLY on fresh install and ONLY ONCE
        if (isReinstall && NotificationService.isIOS) {
          const lastTestTime = localStorage.getItem('last_test_notification');
          const now = Date.now();
          
          // Only show test if not shown in last 5 minutes
          if (!lastTestTime || now - parseInt(lastTestTime) > 5 * 60 * 1000) {
            setTimeout(() => {
              NotificationService.showTestNotification().catch(console.warn);
              localStorage.setItem('last_test_notification', now.toString());
            }, 2000);
          }
        }

      } catch (error) {
        console.error('❌ Notifications initialization error:', error);
        setNotificationStatus({
          isSupported: NotificationService?.isSupported || false,
          isSubscribed: false,
          permission: Notification.permission || 'default',
          error: error.message
        });
        hasInitialized.current = false; // Allow retry on error
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