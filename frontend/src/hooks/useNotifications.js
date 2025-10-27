import { useEffect, useContext } from 'react';
import NotificationService from '../utils/notificationService';
import { StoreContext } from '../context/StoreContext';

export const useNotifications = () => {
  const { token, userId } = useContext(StoreContext);

  useEffect(() => {
    if (!token || !userId) return;

    const initializeNotifications = async () => {
      try {
        // Register service worker
        await NotificationService.registerServiceWorker();

        // Request permission
        const permission = await NotificationService.requestPermission();
        
        if (permission) {
          // Subscribe to push notifications
          const vapidKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
          if (vapidKey) {
            await NotificationService.subscribe(vapidKey, userId, token);
          }
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, [token, userId]);

  return {
    isSupported: NotificationService.isSupported,
    isSubscribed: NotificationService.isSubscribed,
    showNotification: NotificationService.showNotification.bind(NotificationService)
  };
};