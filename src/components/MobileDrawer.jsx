import React from 'react';
import { X, ShieldCheck, Eye, RefreshCw, Settings, LayoutDashboard, HeartHandshake, ArrowDownCircle, ArrowUpCircle, Flame, Landmark, BarChart3, LogOut } from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'vargani', label: 'Donations (वर्गणी)', icon: HeartHandshake },
  { id: 'jama', label: 'Income (जमा)', icon: ArrowDownCircle },
  { id: 'kharch', label: 'Expenses (खर्च)', icon: ArrowUpCircle },
  { id: 'aarti', label: 'Aarti 🚩 (आरती)', icon: Flame },
  { id: 'bank', label: 'Bank FD 🏦 (बँक ठेव)', icon: Landmark },
  { id: 'reports', label: 'Reports (रिपोर्ट)', icon: BarChart3 }
];

export default function MobileDrawer({ isOpen, onClose, isAdmin, activeTab, onChangeTab, onRefresh, onOpenSettings, onLogout }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div
        className="animate-fade-in"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 340,
          background: '#0F172A',
          color: '#ffffff',
          borderRadius: 22,
          boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 14px',
          border: '1px solid rgba(255,255,255,0.12)',
          boxSizing: 'border-box'
        }}
      >
        {/* Header Card with Ganesha Emblem & Role */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="./ganesh_icon.png"
              alt="Ganesh Emblem"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                objectFit: 'cover',
                border: '1.5px solid #FFD700',
                boxShadow: '0 4px 14px rgba(255, 87, 34, 0.4)'
              }}
            />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: '#ffffff', margin: 0 }}>
                Rajmudra Group
              </h3>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                color: isAdmin ? '#FF8A65' : '#CBD5E1', fontSize: 10, fontWeight: 800,
                marginTop: 1
              }}>
                {isAdmin ? <ShieldCheck size={11} /> : <Eye size={11} />}
                <span>{isAdmin ? 'ADMIN MODE' : 'VIEWER MODE'}</span>
              </div>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Menu Navigation Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>
            NAVIGATION MENU
          </span>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onChangeTab(tab.id);
                  onClose();
                }}
                style={{
                  background: isActive ? 'linear-gradient(135deg, #FF5722 0%, #F4511E 100%)' : 'rgba(255,255,255,0.04)',
                  color: isActive ? '#ffffff' : '#CBD5E1',
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: '9px 12px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: isActive ? '0 4px 14px rgba(255, 87, 34, 0.4)' : 'none',
                  textAlign: 'left',
                  width: '100%'
                }}
              >
                <Icon size={16} color={isActive ? '#ffffff' : '#94A3B8'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div style={{ paddingTop: 10, marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            onClick={() => {
              onRefresh();
              onClose();
            }}
            style={{
              background: 'rgba(255,255,255,0.08)', color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
              padding: '8px', fontSize: 11, fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}
          >
            <RefreshCw size={14} /> Refresh Data
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                onOpenSettings();
                onClose();
              }}
              style={{
                background: 'linear-gradient(135deg, #FF5722, #F4511E)', color: '#ffffff',
                border: 'none', borderRadius: 10,
                padding: '8px', fontSize: 11, fontWeight: 800,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: '0 4px 14px rgba(255, 87, 34, 0.35)'
              }}
            >
              <Settings size={14} /> System Settings
            </button>
          )}

          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            style={{
              background: 'rgba(239, 68, 68, 0.15)', color: '#F87171',
              border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 10,
              padding: '8px', fontSize: 11, fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}
          >
            <LogOut size={14} /> Log Out (बाहेर पडा)
          </button>
        </div>
      </div>
    </div>
  );
}
