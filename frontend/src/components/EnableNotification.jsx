import { useState } from 'react';
import NotificationService from '../utils/notificationService';

const EnableNotifications = ({ userId, token }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, requesting, granted, denied
  const [error, setError] = useState(null);

  const handleEnable = async () => {
    setLoading(true);
    setStatus('requesting');
    setError(null);

    try {
      console.log('🔔 User clicked enable notifications');

      // 1. Check if already granted
      if (Notification.permission === 'granted') {
        console.log('✅ Permission already granted');
        await subscribeUser();
        return;
      }

      // 2. Request permission (MUST be from user gesture)
      console.log('📋 Requesting permission...');
      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);

      if (permission === 'granted') {
        await subscribeUser();
      } else {
        setStatus('denied');
        setError('Permission denied. Enable in Settings > Safari > [Your Site]');
      }

    } catch (err) {
      console.error('❌ Error enabling notifications:', err);
      setError(err.message);
      setStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const subscribeUser = async () => {
    try {
      console.log('📤 Subscribing to push...');

      // Wait for service worker
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ Service worker ready');

      // Get VAPID key
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        throw new Error('VAPID key missing');
      }

      // Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });

      console.log('✅ Push subscription created');

      // Send to backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId: userId
        })
      });

      const data = await response.json();
      console.log('Backend response:', data);

      if (data.success) {
        setStatus('granted');
        console.log('✅ Notifications enabled successfully!');

        // Show test notification
        setTimeout(() => {
          registration.showNotification('🎉 Notifications Enabled!', {
            body: 'You\'ll now receive order updates',
            icon: '/icons/android/android-launchericon-192-192.png',
            badge: '/icons/android/android-launchericon-96-96.png',
            vibrate: [200, 100, 200]
          });
        }, 500);
      } else {
        throw new Error(data.message || 'Failed to save subscription');
      }

    } catch (err) {
      console.error('❌ Subscription error:', err);
      setError(err.message);
      setStatus('idle');
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Don't show if not in PWA mode on iOS
  const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  if (isIOSDevice && !isStandalone) {
    return null; // Don't show button in Safari browser
  }

  if (status === 'granted') {
    return (
      <div style={{
        padding: '15px',
        background: '#dcfce7',
        border: '2px solid #22c55e',
        borderRadius: '12px',
        textAlign: 'center',
        margin: '20px'
      }}>
        <div style={{ fontSize: '32px' }}>✅</div>
        <div style={{ fontWeight: 'bold', color: '#166534', marginTop: '10px' }}>
          Notifications Enabled!
        </div>
        <div style={{ fontSize: '14px', color: '#166534', marginTop: '5px' }}>
          You'll receive order updates
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      background: '#fff3cd',
      border: '2px solid #ffc107',
      borderRadius: '12px',
      textAlign: 'center',
      margin: '20px'
    }}>
      <div style={{ fontSize: '48px' }}>🔔</div>
      <h3 style={{ margin: '10px 0', color: '#856404' }}>Enable Order Notifications</h3>
      <p style={{ fontSize: '14px', color: '#856404', marginBottom: '15px' }}>
        Get notified when your order status changes
      </p>

      <button
        onClick={handleEnable}
        disabled={loading}
        style={{
          padding: '15px 40px',
          fontSize: '16px',
          fontWeight: 'bold',
          background: loading ? '#ccc' : '#ff6347',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}
      >
        {loading ? '⏳ Enabling...' : '🔔 Enable Notifications'}
      </button>

      {error && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: '#fee',
          color: '#c00',
          borderRadius: '6px',
          fontSize: '13px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {status === 'denied' && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: '#fee',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#666'
        }}>
          <strong>How to enable in Settings:</strong><br />
          Settings → Safari → Advanced → Website Data → Find your site
        </div>
      )}
    </div>
  );
};

export default EnableNotifications;