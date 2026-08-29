import React, { useState } from 'react';
import { Menu, Calendar, LayoutDashboard, HeartHandshake, ArrowDownCircle, ArrowUpCircle, Flame, Landmark, BarChart3, ShieldCheck, Eye, RefreshCw, Settings, LogOut } from 'lucide-react';
import MobileDrawer from './MobileDrawer';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'vargani', label: 'Donations', icon: HeartHandshake },
  { id: 'jama', label: 'Income', icon: ArrowDownCircle },
  { id: 'kharch', label: 'Expenses', icon: ArrowUpCircle },
  { id: 'aarti', label: 'Aarti ', icon: Flame },
  { id: 'bank', label: 'Bank FD 🏦', icon: Landmark },
  { id: 'reports', label: 'Reports', icon: BarChart3 }
];

export default function Navbar({ isAdmin, activeYear, activeTab, onChangeTab, onOpenSettings, onRefresh, onLogout }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="topbar" style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        color: '#ffffff',
        padding: '10px 12px',
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9990,
        boxShadow: '0 8px 30px rgba(15, 23, 42, 0.35)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {/* Brand Logo with Emblem & Static Small Year Text */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <img
              src="./ganesh_icon.png"
              alt="Ganesh Emblem"
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                objectFit: 'cover',
                border: '1.5px solid #FFD700',
                boxShadow: '0 4px 14px rgba(255, 87, 34, 0.4)'
              }}
            />

            <div>
              <h1 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: '#ffffff', letterSpacing: -0.3 }}>
                Rajmudra Group
              </h1>

              {/* Static Small Year Text */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                <Calendar size={11} color="#FF9100" />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#FFD700', opacity: 0.9 }}>
                  Year {activeYear}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Top Navigation Tabs */}
          <div className="desktop-nav-tabs" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255, 255, 255, 0.06)', padding: 4, borderRadius: 18, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onChangeTab(tab.id)}
                  style={{
                    background: isActive ? 'linear-gradient(135deg, #FF5722 0%, #F4511E 100%)' : 'transparent',
                    color: isActive ? '#ffffff' : '#CBD5E1',
                    border: 'none',
                    borderRadius: 14,
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    boxShadow: isActive ? '0 4px 14px rgba(255, 87, 34, 0.4)' : 'none',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <Icon size={16} color={isActive ? '#ffffff' : '#94A3B8'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="desktop-nav-tabs" style={{ alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: isAdmin ? 'rgba(255, 87, 34, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: isAdmin ? '1px solid rgba(255, 87, 34, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
              color: isAdmin ? '#FF8A65' : '#CBD5E1',
              padding: '4px 10px', borderRadius: 16, fontSize: 11, fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: 0.5
            }}>
              {isAdmin ? <ShieldCheck size={13} /> : <Eye size={13} />}
              <span>{isAdmin ? 'Admin' : 'Viewer'}</span>
            </div>

            <button
              onClick={onRefresh}
              style={{
                background: 'rgba(255, 255, 255, 0.08)', border: 'none', color: '#ffffff',
                cursor: 'pointer', width: 34, height: 34, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Refresh Data"
            >
              <RefreshCw size={15} />
            </button>

            {isAdmin && (
              <button
                onClick={onOpenSettings}
                style={{
                  background: 'linear-gradient(135deg, #FF5722, #F4511E)', border: 'none', color: '#ffffff',
                  cursor: 'pointer', width: 34, height: 34, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(255, 87, 34, 0.35)'
                }}
                title="Settings"
              >
                <Settings size={16} />
              </button>
            )}

            <button
              onClick={onLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171',
                cursor: 'pointer', height: 34, padding: '0 12px', borderRadius: 10,
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800
              }}
              title="Log Out"
            >
              <LogOut size={14} /> Log Out
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setDrawerOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #FF5722 0%, #F4511E 100%)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '8px 14px',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(255, 87, 34, 0.4)'
            }}
          >
            <Menu size={18} /> Menu
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        isAdmin={isAdmin}
        activeTab={activeTab}
        onChangeTab={onChangeTab}
        onRefresh={onRefresh}
        onOpenSettings={onOpenSettings}
        onLogout={onLogout}
      />
    </>
  );
}
