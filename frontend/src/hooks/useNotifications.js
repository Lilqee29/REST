
import { useEffect, useContext } from 'react';
import NotificationService from '../utils/notificationService';
import { StoreContext } from '../context/StoreContext';

export const useNotifications = () => {
  const { token, userId } = useContext(StoreContext);

  useEffect(() => {
    if (!token || !userId) {
      console.log('⚠️ No token or userId, skipping notifications');
      return;
    }

const initializeNotifications = async () => {
  try {
    console.log('🔔 Initializing notifications...');

    // 1️⃣ Register service worker
    const registration = await NotificationService.registerServiceWorker();
    if (!registration) {
      console.error('Failed to register service worker');
      return;
    }

    // 2️⃣ Wait until the service worker is fully ready
    const swRegistration = await waitForServiceWorkerReady();

    // 3️⃣ Request permission
    const permission = await NotificationService.requestPermission();
    if (!permission) {
      console.warn('⚠️ Notification permission denied');
      return;
    }

    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.error('❌ VAPID key not found in .env');
      return;
    }

    // 4️⃣ Check if already subscribed
    const existingSubscription = await swRegistration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('✅ Already subscribed to push notifications');
      NotificationService.isSubscribed = true;
      return;
    }

    // 5️⃣ Otherwise, subscribe
    const subscribed = await NotificationService.subscribe(vapidKey, userId, token);
    if (subscribed) {
      console.log('✅ Notifications enabled!');
    }
  } catch (error) {
    console.error('❌ Error initializing notifications:', error);
  }
};

// Helper: wait until SW ready
const waitForServiceWorkerReady = async (maxAttempts = 5) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (navigator.serviceWorker.controller) {
      return await navigator.serviceWorker.ready;
    }
    console.log(`⏳ Waiting for service worker... (${attempt + 1}/${maxAttempts})`);
    await new Promise((resolve) => setTimeout(resolve, 500)); // wait 0.5s
  }
  throw new Error('Service worker not ready after waiting');
};


    initializeNotifications();
  }, [token, userId]);

  return {
    isSupported: NotificationService.isSupported,
    isSubscribed: NotificationService.isSubscribed,
    showNotification: NotificationService.showNotification.bind(NotificationService)
  };
};
