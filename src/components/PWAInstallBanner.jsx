import React, { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(true);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
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
      setShowGuideModal(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Centered PWA Banner Card with SINGLE Close Button */}
      <div style={{
        position: 'fixed',
        top: 70,
        left: 0,
        right: 0,
        margin: '0 auto',
        width: 'calc(100% - 24px)',
        maxWidth: 480,
        background: '#1E293B',
        border: '2px solid #FFD700',
        borderRadius: 20,
        padding: '14px 16px',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        zIndex: 99990,
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
        boxSizing: 'border-box'
      }} className="animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="./ganesh_icon.png"
            alt="Rajmudra Group Icon"
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              objectFit: 'cover',
              border: '1.5px solid #FFD700',
              boxShadow: '0 4px 14px rgba(255, 87, 34, 0.4)',
              flexShrink: 0
            }}
          />
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 900, margin: 0, color: '#ffffff' }}>
              Rajmudra Group App
            </h4>
            <span style={{ fontSize: 12, color: '#FFD700', fontWeight: 800 }}>
              📲 Install App on Phone Home Screen
            </span>
          </div>
        </div>

        {/* Action Buttons: Single Close button + 100% Install button */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleInstallClick}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #FF5722 0%, #F4511E 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 14,
              padding: '12px 16px',
              fontSize: 14,
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: 8,
              boxShadow: '0 6px 20px rgba(255, 87, 34, 0.45)'
            }}
          >
            <Download size={18} /> Install Rajmudra App
          </button>

          <button
            onClick={handleDismiss}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#CBD5E1',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 14,
              padding: '12px 18px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Guide Modal strictly in English */}
      {showGuideModal && (
        <div className="modal-overlay" onClick={() => setShowGuideModal(false)}>
          <div className="modal-sheet animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{
                width: 54, height: 54, borderRadius: 18, margin: '0 auto 12px auto',
                background: 'linear-gradient(135deg, #FF5722 0%, #FF9100 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(255, 87, 34, 0.4)'
              }}>
                <Smartphone size={28} color="#ffffff" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                Rajmudra Group App Installation
              </h3>
              <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                Follow these simple steps to install the app on your phone:
              </p>
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 20, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                <span style={{ background: '#FF5722', color: '#ffffff', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>1</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                  Tap your browser menu icon (<strong>⋮</strong> or <strong>Share 📤</strong>).
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ background: '#FF5722', color: '#ffffff', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>2</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                  Select <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong>.
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px' }}
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
