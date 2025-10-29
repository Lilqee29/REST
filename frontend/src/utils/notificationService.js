class NotificationService {
  constructor() {
    this.isIOS = this.checkIOS();
    this.isSupported = this.checkSupport();
    this.isSubscribed = false;
  }

  // Detect iOS devices
  checkIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  // Check browser & device support
  checkSupport() {
    const hasBasicSupport =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    if (this.checkIOS()) {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;

      if (!isStandalone) {
        console.warn('⚠️ iOS: Push notifications only work in installed PWA');
        return false;
      }

      const iOSVersion = this.getIOSVersion();
      if (iOSVersion && iOSVersion < 16.4) {
        console.warn('⚠️ iOS: Push notifications require iOS 16.4+');
        return false;
      }
    }

    return hasBasicSupport;
  }

  getIOSVersion() {
    const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
    if (match) return parseFloat(`${match[1]}.${match[2]}`);
    return null;
  }

  // Register SW or return existing
  async registerServiceWorker() {
    if (!this.isSupported) return false;

    try {
      const existing = await navigator.serviceWorker.getRegistration('/');
      if (existing) {
        // Force update to ensure latest SW
        await existing.update();
        return existing;
      }

      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      await navigator.serviceWorker.ready;
      return registration;
    } catch (error) {
      console.error('❌ SW registration failed:', error);
      return false;
    }
  }

  // Request permission
  async requestPermission() {
    if (!this.isSupported) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('❌ Permission request failed:', error);
      return false;
    }
  }

  // Subscribe or refresh existing subscription
  async subscribe(vapidPublicKey, userId, token, forceNew = false) {
    if (!this.isSupported) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      // 🔥 CRITICAL FIX: Unsubscribe old subscription and create fresh one on reinstall
      if (subscription && forceNew) {
        console.log('🔄 Force refresh: Removing old subscription...');
        try {
          await subscription.unsubscribe();
          subscription = null;
        } catch (err) {
          console.warn('⚠️ Failed to unsubscribe old subscription:', err);
          subscription = null;
        }
      }

      // Try to verify existing subscription with backend
      if (subscription && !forceNew) {
        console.log('✅ Existing subscription found, verifying with backend...');
        try {
          await this.sendSubscriptionToBackend(subscription, userId, token);
          this.isSubscribed = true;
          return true;
        } catch (error) {
          console.warn('⚠️ Backend rejected subscription, creating new one:', error.message);
          // If backend rejects, unsubscribe and create new
          try {
            await subscription.unsubscribe();
          } catch (e) {
            console.warn('Failed to unsubscribe:', e);
          }
          subscription = null;
        }
      }

      // Create new subscription
      if (!subscription) {
        console.log('📝 Creating new subscription...');
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
        });

        await this.sendSubscriptionToBackend(subscription, userId, token);
        this.isSubscribed = true;
        return true;
      }

    } catch (error) {
      console.error('❌ Subscription failed:', error);
      if (this.isIOS) console.error('iOS details:', { error: error.message, permission: Notification.permission });
      return false;
    }
  }

  async sendSubscriptionToBackend(subscription, userId, token) {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://restaurant-backend-06ce.onrender.com';
    try {
      const response = await fetch(`${apiUrl}/api/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subscription: subscription.toJSON(), userId })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to save subscription');
      return data;
    } catch (error) {
      console.error('❌ Saving subscription failed:', error);
      throw error;
    }
  }

  // Unsubscribe device
  async unsubscribe(token) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return;

      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      const apiUrl = import.meta.env.VITE_API_URL || 'https://restaurant-backend-06ce.onrender.com';
      await fetch(`${apiUrl}/api/notifications/unsubscribe`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ endpoint })
      });

      this.isSubscribed = false;
    } catch (error) {
      console.error('❌ Unsubscribe failed:', error);
    }
  }

  // Test notification
  async showTestNotification() {
    if (!this.isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Test Notification', {
        body: 'Notifications are working! 🎉',
        icon: '/logo.png',
        badge: '/logo-small.png',
        tag: 'test-notification'
      });
    } catch (error) {
      console.error('❌ Test notification failed:', error);
    }
  }

  // Get subscription status
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
      console.error('❌ Failed to get subscription status:', error);
      return null;
    }
  }

  // Convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
  }
}

export default new NotificationService();