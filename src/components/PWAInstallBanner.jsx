import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(true); // Prominently show on 1st visit

  useEffect(() => {
    // Check if user previously dismissed banner
    const dismissed = localStorage.getItem('rajmudra_pwa_dismissed');
    if (dismissed) {
      setShowBanner(false);
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instructions for iOS Safari or browsers without native prompt
      alert('📲 Rajmudra Group App Install Instructions:\n\n1. Tap the Share button (📤) in your browser\n2. Scroll down & select "Add to Home Screen" (➕)');
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('rajmudra_pwa_dismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 65,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 20px)',
      maxWidth: 500,
      background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
      border: '1.5px solid #FFD700',
      borderRadius: 18,
      padding: '10px 14px',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      zIndex: 9980,
      boxShadow: '0 14px 40px rgba(0, 0, 0, 0.5)'
    }} className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img
          src="./ganesh_icon.png"
          alt="Ganesh Murti App Icon"
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            objectFit: 'cover',
            border: '1px solid #FFD700',
            boxShadow: '0 4px 12px rgba(255, 87, 34, 0.4)',
            flexShrink: 0
          }}
        />
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 900, margin: 0, color: '#ffffff' }}>
            Rajmudra Group App
          </h4>
          <span style={{ fontSize: 11, color: '#FFD700', fontWeight: 700 }}>
            📲 1-Tap Home Screen Install
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={handleInstallClick}
          style={{
            background: 'linear-gradient(135deg, #FF5722 0%, #F4511E 100%)',
            color: '#ffffff', border: 'none', borderRadius: 12,
            padding: '8px 12px', fontSize: 12, fontWeight: 800,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            boxShadow: '0 4px 14px rgba(255, 87, 34, 0.4)',
            whiteSpace: 'nowrap'
          }}
        >
          <Download size={14} /> Install App
        </button>
        <button
          onClick={handleDismiss}
          style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 2 }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
