class NotificationService {
  constructor() {
    this.isSupported = this.checkSupport();
    this.isSubscribed = false;
    this.isIOS = this.checkIOS();
  }

  checkIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  checkSupport() {
    const hasBasicSupport = 
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    // iOS specific checks
    if (this.checkIOS()) {
      // Check if running as PWA (standalone mode)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone === true;
      
      if (!isStandalone) {
        console.warn('⚠️ iOS: Push notifications only work in installed PWA (Add to Home Screen)');
        return false;
      }

      // Check iOS version (needs 16.4+)
      const iOSVersion = this.getIOSVersion();
      if (iOSVersion && iOSVersion < 16.4) {
        console.warn('⚠️ iOS: Push notifications require iOS 16.4 or later');
        return false;
      }
    }

    return hasBasicSupport;
  }

  getIOSVersion() {
    const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
    if (match) {
      return parseFloat(`${match[1]}.${match[2]}`);
    }
    return null;
  }

  async registerServiceWorker() {
    if (!this.isSupported) {
      console.warn('Push notifications not supported in this browser');
      return false;
    }

    try {
      // Check if already registered
      const existing = await navigator.serviceWorker.getRegistration('/');
      if (existing) {
        console.log('🟢 Service Worker already registered');
        
        // Wait for it to be active
        if (existing.installing || existing.waiting) {
          await new Promise(resolve => {
            const worker = existing.installing || existing.waiting;
            worker.addEventListener('statechange', () => {
              if (worker.state === 'activated') resolve();
            });
          });
        }
        
        return existing;
      }

      // Register new service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js', { 
        scope: '/',
        updateViaCache: 'none' // Ensure fresh SW on iOS
      });

      console.log('✅ Service Worker registered');

      // Wait for activation
      await navigator.serviceWorker.ready;
      console.log('✅ Service Worker ready');

      return registration;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      return false;
    }
  }

  async requestPermission() {
    if (!this.isSupported) {
      if (this.isIOS) {
        console.warn('⚠️ iOS: Make sure the app is installed (Add to Home Screen) and you\'re running iOS 16.4+');
      } else {
        console.warn('Notifications not supported');
      }
      return false;
    }

    if (Notification.permission === 'granted') {
      console.log('✅ Notification permission already granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('⚠️ Notification permission denied. User must enable in settings.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log(`📱 Permission result: ${permission}`);
      return permission === 'granted';
    } catch (error) {
      console.error('❌ Error requesting permission:', error);
      return false;
    }
  }

  async subscribe(vapidPublicKey, userId, token) {
    if (!this.isSupported) {
      console.error('❌ Push not supported on this device/browser');
      return false;
    }

    try {
      console.log('🔔 Starting subscription process...');

      // Ensure service worker is ready
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ Service worker ready');

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        console.log('✅ Found existing subscription');
      } else {
        console.log('📝 Creating new subscription...');
        
        // Subscribe to push
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
        });
        
        console.log('✅ Subscription created');
      }

      // Send to backend
      await this.sendSubscriptionToBackend(subscription, userId, token);
      
      this.isSubscribed = true;
      console.log('✅ Push subscription successful');
      return true;
    } catch (error) {
      console.error('❌ Push subscription failed:', error);
      
      // iOS specific error handling
      if (this.isIOS) {
        console.error('iOS Error Details:', {
          error: error.message,
          isStandalone: window.navigator.standalone,
          permission: Notification.permission
        });
      }
      
      return false;
    }
  }

  async sendSubscriptionToBackend(subscription, userId, token) {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://restaurant-backend-06ce.onrender.com';
      
      console.log('📤 Sending subscription to backend...');
      
      const response = await fetch(`${apiUrl}/api/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save subscription');
      }

      console.log('✅ Subscription saved to backend:', data);
      return data;
    } catch (error) {
      console.error('❌ Error saving subscription:', error);
      throw error;
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  async unsubscribe(token) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        
        // Also remove from backend
        const apiUrl = import.meta.env.VITE_API_URL || 'https://restaurant-backend-06ce.onrender.com';
        await fetch(`${apiUrl}/api/notifications/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        this.isSubscribed = false;
        console.log('✅ Unsubscribed from push notifications');
      }
    } catch (error) {
      console.error('❌ Error unsubscribing:', error);
    }
  }

  // Test if notifications work
  async showTestNotification() {
    if (!this.isSupported) {
      console.error('Notifications not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Test Notification', {
        body: 'If you see this, notifications are working! 🎉',
        icon: '/logo.png',
        badge: '/logo-small.png',
        tag: 'test-notification',
        requireInteraction: false,
        vibrate: [200, 100, 200]
      });
      console.log('✅ Test notification shown');
    } catch (error) {
      console.error('❌ Error showing test notification:', error);
    }
  }

  // Get current subscription status
  async getSubscriptionStatus() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      return {
        isSubscribed: !!subscription,
        permission: Notification.permission,
        isSupported: this.isSupported,
        isIOS: this.isIOS,
        subscription: subscription ? subscription.toJSON() : null
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return null;
    }
  }
}

export default new NotificationService();