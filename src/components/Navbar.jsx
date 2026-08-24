import React from 'react';
import { Settings, ShieldCheck, Eye, RefreshCw, Crown } from 'lucide-react';

export default function Navbar({ isAdmin, activeYear, onOpenSettings, onRefresh }) {
  return (
    <header style={{
      background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
      color: '#ffffff',
      padding: '16px 20px',
      position: 'sticky',
      top: 0,
      zIndex: 80,
      boxShadow: '0 8px 30px rgba(15, 23, 42, 0.25)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: 'linear-gradient(135deg, #FF5722 0%, #FF9100 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(255, 87, 34, 0.4)'
          }}>
            <Crown size={22} color="#ffffff" />
          </div>

          <div>
            <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: '#ffffff', letterSpacing: -0.3 }}>
              Rajmudra Mandal
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: '#10B981',
                boxShadow: '0 0 8px #10B981'
              }} />
              <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Year {activeYear}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: isAdmin ? 'rgba(255, 87, 34, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            border: isAdmin ? '1px solid rgba(255, 87, 34, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
            color: isAdmin ? '#FF8A65' : '#CBD5E1',
            padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: 0.5
          }}>
            {isAdmin ? <ShieldCheck size={14} /> : <Eye size={14} />}
            <span>{isAdmin ? 'Admin' : 'Viewer'}</span>
          </div>

          <button
            onClick={onRefresh}
            style={{
              background: 'rgba(255, 255, 255, 0.08)', border: 'none', color: '#ffffff',
              cursor: 'pointer', width: 36, height: 36, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease'
            }}
            title="Refresh Data"
          >
            <RefreshCw size={17} />
          </button>

          {isAdmin && (
            <button
              onClick={onOpenSettings}
              style={{
                background: 'linear-gradient(135deg, #FF5722, #F4511E)', border: 'none', color: '#ffffff',
                cursor: 'pointer', width: 36, height: 36, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(255, 87, 34, 0.35)'
              }}
              title="Settings"
            >
              <Settings size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
