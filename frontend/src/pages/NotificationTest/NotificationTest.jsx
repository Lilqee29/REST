import { useEffect, useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationService from '../../utils/notificationService';

const NotificationTest = () => {
  const status = useNotifications();
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    addLog('Page loaded');
    addLog(`Device: ${navigator.userAgent.substring(0, 50)}...`);
  }, []);

  const handleTest = async () => {
    addLog('Testing notification...');
    try {
      await status.showNotification();
      addLog('✅ Test sent!');
    } catch (err) {
      addLog(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '14px' }}>
      <h1>🔔 Notification Test</h1>
      
      <div style={{ 
        background: '#f0f0f0', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px' 
      }}>
        <h3>Status:</h3>
        <p>Supported: {status.isSupported ? '✅' : '❌'}</p>
        <p>Subscribed: {status.isSubscribed ? '✅' : '❌'}</p>
        <p>Permission: {status.permission}</p>
        {status.error && <p style={{ color: 'red' }}>Error: {status.error}</p>}
      </div>

      <button 
        onClick={handleTest}
        disabled={!status.isSubscribed}
        style={{
          padding: '15px 30px',
          fontSize: '16px',
          background: status.isSubscribed ? '#4CAF50' : '#ccc',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: status.isSubscribed ? 'pointer' : 'not-allowed'
        }}
      >
        Test Notification
      </button>

      <div style={{
        marginTop: '30px',
        background: '#000',
        color: '#0f0',
        padding: '15px',
        borderRadius: '8px',
        maxHeight: '300px',
        overflow: 'auto'
      }}>
        <h3 style={{ color: '#fff' }}>Logs:</h3>
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  );
};

export default NotificationTest;