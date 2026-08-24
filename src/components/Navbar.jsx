import React from 'react';
import { Settings, ShieldCheck, Eye, RefreshCw, Crown, Calendar } from 'lucide-react';
import { db } from '../services/db';

const YEARS = ['2026-27', '2025-26', '2024-25', '2027-28', '2028-29'];

export default function Navbar({ isAdmin, activeYear, onOpenSettings, onRefresh, onYearChange }) {
  const handleSelectYear = (e) => {
    const newYear = e.target.value;
    if (!isAdmin && (newYear === '2024-25' || newYear === '2025-26')) {
      alert('Access Restricted: Previous financial audit records (2024 & 2025) are visible to Mandal Admin only.');
      return;
    }
    db.setSetting('active_year', newYear);
    if (onYearChange) onYearChange(newYear);
    onRefresh();
  };

  return (
    <header style={{
      background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
      color: '#ffffff',
      padding: '14px 20px',
      position: 'sticky',
      top: 0,
      zIndex: 80,
      boxShadow: '0 8px 30px rgba(15, 23, 42, 0.25)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 14,
            background: 'linear-gradient(135deg, #FF5722 0%, #FF9100 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(255, 87, 34, 0.4)'
          }}>
            <Crown size={20} color="#ffffff" />
          </div>

          <div>
            <h1 style={{ fontSize: 17, fontWeight: 900, margin: 0, color: '#ffffff', letterSpacing: -0.3 }}>
              Rajmudra Mandal
            </h1>
            
            {/* Clickable Header Year Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <Calendar size={12} color="#FF9100" />
              <select
                value={activeYear}
                onChange={handleSelectYear}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFD700',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '2px 6px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {YEARS.map(y => (
                  <option key={y} value={y} style={{ background: '#0F172A', color: '#ffffff' }}>
                    Year {y} { (!isAdmin && (y === '2024-25' || y === '2025-26')) ? '🔒' : '' }
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease'
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
        </div>
      </div>
    </header>
  );
}
