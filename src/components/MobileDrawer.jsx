import React from 'react';
import { X, ShieldCheck, Eye, RefreshCw, Settings, LayoutDashboard, HeartHandshake, ArrowDownCircle, ArrowUpCircle, Flame, Landmark, BarChart3 } from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'vargani', label: 'Donations (वर्गणी)', icon: HeartHandshake },
  { id: 'jama', label: 'Income (जमा)', icon: ArrowDownCircle },
  { id: 'kharch', label: 'Expenses (खर्च)', icon: ArrowUpCircle },
  { id: 'aarti', label: 'Aarti 🚩 (आरती)', icon: Flame },
  { id: 'bank', label: 'Bank FD 🏦 (बँक ठेव)', icon: Landmark },
  { id: 'reports', label: 'Reports (रिपोर्ट)', icon: BarChart3 }
];

export default function MobileDrawer({ isOpen, onClose, isAdmin, activeTab, onChangeTab, onRefresh, onOpenSettings }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'flex-start', justifyContent: 'flex-end', padding: 0 }}>
      <div
        className="animate-fade-in"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 320,
          height: '100vh',
          background: '#0F172A',
          color: '#ffffff',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '20px 18px',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          overflowY: 'auto'
        }}
      >
        <div>
          {/* Header Card with Ganesha Murti Logo & User Role */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="./ganesh_icon.png"
                alt="Ganesh Murti"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
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
                  color: isAdmin ? '#FF8A65' : '#CBD5E1', fontSize: 11, fontWeight: 800,
                  marginTop: 2
                }}>
                  {isAdmin ? <ShieldCheck size={12} /> : <Eye size={12} />}
                  <span>{isAdmin ? 'ADMIN MODE' : 'VIEWER MODE'}</span>
                </div>
              </div>
            </div>

            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}>
              <X size={22} />
            </button>
          </div>

          {/* Menu Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
              MAIN NAVIGATION
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
                    borderRadius: 14,
                    padding: '12px 14px',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    boxShadow: isActive ? '0 6px 18px rgba(255, 87, 34, 0.4)' : 'none',
                    textAlign: 'left',
                    width: '100%'
                  }}
                >
                  <Icon size={18} color={isActive ? '#ffffff' : '#94A3B8'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => {
              onRefresh();
              onClose();
            }}
            style={{
              background: 'rgba(255,255,255,0.08)', color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14,
              padding: '12px', fontSize: 13, fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
          >
            <RefreshCw size={16} /> Refresh Data (डेटा रिफ्रेश करा)
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                onOpenSettings();
                onClose();
              }}
              style={{
                background: 'linear-gradient(135deg, #FF5722, #F4511E)', color: '#ffffff',
                border: 'none', borderRadius: 14,
                padding: '12px', fontSize: 13, fontWeight: 800,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 14px rgba(255, 87, 34, 0.35)'
              }}
            >
              <Settings size={16} /> System Settings (सेटिंद्ज)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
