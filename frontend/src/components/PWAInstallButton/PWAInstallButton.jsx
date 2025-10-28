import { useState, useEffect } from 'react';
import { Download, Check } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import './PWAInstallButton.css';

const PWAInstallButton = () => {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (isInstallable && !isInstalled && !localStorage.getItem('pwa-install-prompt-dismissed')) {
      // Show install prompt after 3 seconds
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  if (isInstalled) {
    return (
      <div className="pwa-installed-badge">
        <Check size={16} />
        <span>App Installed</span>
      </div>
    );
  }

  if (!isInstallable) {
    return null;
  }

  return (
    <>
      {/* Install Button in Navbar */}
      <button 
        className="pwa-install-button"
        onClick={() => {
          installApp();
          setShowPrompt(false);
        }}
        title="Install app on your device"
      >
        <Download size={20} />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {/* Modal Prompt */}
      {showPrompt && (
        <div className="pwa-install-modal">
          <div className="pwa-install-card">
            <button 
              className="pwa-close-btn"
              onClick={() => {
                setShowPrompt(false);
                localStorage.setItem('pwa-install-prompt-dismissed', 'true');
              }}
            >
              ✕
            </button>

            <div className="pwa-install-content">
              <Download size={48} className="pwa-icon" />
              <h3>Install Restaurant Express</h3>
              <p>Get quick access to orders and menu on your home screen</p>
              
              <div className="pwa-install-benefits">
                <div className="benefit">
                  <span>⚡</span>
                  <span>Faster Access</span>
                </div>
                <div className="benefit">
                  <span>📱</span>
                  <span>Home Screen Icon</span>
                </div>
                <div className="benefit">
                  <span>📴</span>
                  <span>Works Offline</span>
                </div>
              </div>

              <button 
                className="pwa-install-primary-btn"
                onClick={async () => {
                  await installApp();
                  setShowPrompt(false);
                }}
              >
                Install Now
              </button>

              <button 
                className="pwa-install-dismiss-btn"
                onClick={() => {
                  setShowPrompt(false);
                  localStorage.setItem('pwa-install-prompt-dismissed', 'true');
                }}
              >
                Remind Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallButton;