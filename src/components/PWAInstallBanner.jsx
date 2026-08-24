import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X } from 'lucide-react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('PWA installed successfully by user.');
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 70,
      left: '50%',
      transform: translateX('-50%'),
      width: 'calc(100% - 32px)',
      maxWidth: 520,
      background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
      border: '1px solid rgba(255, 87, 34, 0.4)',
      borderRadius: 20,
      padding: '12px 18px',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      zIndex: 9980,
      boxShadow: '0 14px 40px rgba(0, 0, 0, 0.4)'
    }} className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 14,
          background: 'linear-gradient(135deg, #FF5722 0%, #FF9100 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <Smartphone size={22} color="#ffffff" />
        </div>
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 900, margin: 0, color: '#ffffff' }}>
            राजमुद्रा मंडळ अॅप इंस्टॉल करा
          </h4>
          <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
            Quick 1-Tap Mobile Home Screen Install
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={handleInstallClick}
          style={{
            background: 'linear-gradient(135deg, #FF5722 0%, #F4511E 100%)',
            color: '#ffffff', border: 'none', borderRadius: 12,
            padding: '8px 14px', fontSize: 12, fontWeight: 800,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 14px rgba(255, 87, 34, 0.4)'
          }}
        >
          <Download size={14} /> Install
        </button>
        <button
          onClick={() => setShowBanner(false)}
          style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
