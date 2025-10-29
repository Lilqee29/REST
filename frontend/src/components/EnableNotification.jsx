import { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';

const EnableNotifications = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false); // ✅ new state

  const { isSubscribed, permission, showNotification } = useNotifications();

  // Detect iOS Safari
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (isIOS && !isStandalone) return null; // Only show in installed PWA on iOS

  const handleEnable = async () => {
    setLoading(true);
    setError(null);

    try {
      // Request permission if needed
      if (Notification.permission === 'default') {
        const result = await Notification.requestPermission();
        if (result !== 'granted') {
          setError('Permission denied. Enable in Settings > Safari > [Your Site]');
          return;
        }
      }

      // Show test notification
      await showNotification?.();

      // ✅ Set success and remove after 2s
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);

    } catch (err) {
      console.error('❌ Error enabling notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isSubscribed || permission === 'granted') {
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

      {success && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: '#dcfce7',
          color: '#166534',
          borderRadius: '6px',
          fontSize: '13px'
        }}>
          ✅ Notifications Enabled!
        </div>
      )}
    </div>
  );
};

export default EnableNotifications;
