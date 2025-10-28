import { useState, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import NotificationService from '../utils/notificationService';

const NotificationDebug = ({ onClose }) => {
  const status = useNotifications();
  const [detailedStatus, setDetailedStatus] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-10), { message, type, timestamp }]);
  };

  useEffect(() => {
    const checkStatus = async () => {
      const detailed = await NotificationService.getSubscriptionStatus();
      setDetailedStatus(detailed);
    };
    checkStatus();
  }, [status]);

const handleTestNotification = async () => {
  addLog('Testing notification...', 'info');
  try {
    if (status?.showNotification) {
      await status.showNotification();
      addLog('Test notification sent!', 'success');
    } else {
      addLog('⚠️ showNotification() not available in status', 'error');
    }
  } catch (error) {
    addLog(`Error: ${error.message}`, 'error');
  }
};


  const handleRefreshStatus = async () => {
    addLog('Refreshing status...', 'info');
    const detailed = await NotificationService.getSubscriptionStatus();
    setDetailedStatus(detailed);
    addLog('Status refreshed', 'success');
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '350px',
      maxHeight: '80vh',
      overflow: 'auto',
      backgroundColor: '#fff',
      border: '2px solid #ff6347',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      zIndex: 9999,
      fontSize: '13px',
      fontFamily: 'monospace'
    }}>
      <h3 style={{ margin: '0 0 12px 0', color: '#ff6347', fontSize: '16px' }}>
        🔔 Notification Debug
      </h3>

      {/* Device Info */}
      <div style={{ 
        backgroundColor: '#f8f8f8', 
        padding: '10px', 
        borderRadius: '6px', 
        marginBottom: '12px' 
      }}>
        <strong>📱 Device Info:</strong>
        <div style={{ marginTop: '6px', fontSize: '11px' }}>
          <div>iOS: {isIOSDevice ? '✅ Yes' : '❌ No'}</div>
          <div>PWA Mode: {isStandalone ? '✅ Yes' : '❌ No'}</div>
          <div>iOS Version: {detailedStatus?.isIOS ? '16.4+' : 'N/A'}</div>
        </div>
      </div>

      {/* Notification Status */}
      <div style={{ 
        backgroundColor: '#f8f8f8', 
        padding: '10px', 
        borderRadius: '6px', 
        marginBottom: '12px' 
      }}>
        <strong>📊 Status:</strong>
        <div style={{ marginTop: '6px', fontSize: '11px' }}>
          <div>Supported: {status.isSupported ? '✅' : '❌'}</div>
          <div>Subscribed: {status.isSubscribed ? '✅' : '❌'}</div>
          <div>Permission: {status.permission === 'granted' ? '✅' : status.permission === 'denied' ? '❌' : '⚠️'} {status.permission}</div>
        </div>
        {status.error && (
          <div style={{ 
            color: 'red', 
            fontSize: '11px', 
            marginTop: '6px',
            backgroundColor: '#ffe6e6',
            padding: '6px',
            borderRadius: '4px'
          }}>
            ⚠️ {status.error}
          </div>
        )}
      </div>

      {/* Subscription Details */}
      {detailedStatus?.subscription && (
        <div style={{ 
          backgroundColor: '#f8f8f8', 
          padding: '10px', 
          borderRadius: '6px', 
          marginBottom: '12px',
          maxHeight: '100px',
          overflow: 'auto'
        }}>
          <strong>🔑 Subscription:</strong>
          <pre style={{ 
            fontSize: '9px', 
            margin: '6px 0 0 0',
            wordBreak: 'break-all',
            whiteSpace: 'pre-wrap'
          }}>
            {JSON.stringify(detailedStatus.subscription, null, 2)}
          </pre>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button
          onClick={handleTestNotification}
          disabled={!status.isSupported || !status.isSubscribed}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: status.isSubscribed ? '#ff6347' : '#ccc',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: status.isSubscribed ? 'pointer' : 'not-allowed',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          Test 🔔
        </button>
        <button
          onClick={handleRefreshStatus}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          Refresh 🔄
        </button>
      </div>

      {/* iOS Warning */}
      {isIOSDevice && !isStandalone && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          padding: '10px',
          borderRadius: '6px',
          marginBottom: '12px',
          fontSize: '11px'
        }}>
          <strong>⚠️ iOS Users:</strong>
          <br />
          You must install this app to your Home Screen to receive notifications!
          <br />
          <br />
          1. Tap Share button (⬆️)
          <br />
          2. Select "Add to Home Screen"
          <br />
          3. Open from Home Screen
        </div>
      )}

      {/* Logs */}
      <div style={{ 
        backgroundColor: '#000', 
        color: '#0f0', 
        padding: '8px', 
        borderRadius: '6px',
        maxHeight: '150px',
        overflow: 'auto',
        fontSize: '10px'
      }}>
        <strong style={{ color: '#fff' }}>📋 Logs:</strong>
        {logs.length === 0 ? (
          <div style={{ color: '#666', marginTop: '6px' }}>No logs yet...</div>
        ) : (
          logs.map((log, idx) => (
            <div 
              key={idx} 
              style={{ 
                marginTop: '4px',
                color: log.type === 'error' ? '#ff6b6b' : log.type === 'success' ? '#51cf66' : '#0f0'
              }}
            >
              [{log.timestamp}] {log.message}
            </div>
          ))
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'transparent',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          color: '#999',
          padding: '0',
          width: '24px',
          height: '24px'
        }}
      >
        ×
      </button>
    </div>
  );
};

export default NotificationDebug;