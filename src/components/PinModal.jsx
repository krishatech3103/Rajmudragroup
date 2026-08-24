import React, { useState } from 'react';
import { db } from '../services/db';
import { Lock, User, Eye, EyeOff, ArrowRight, Calendar } from 'lucide-react';

export default function PinModal({ onSuccess }) {
  const availableYears = db.getAvailableYears();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedYear, setSelectedYear] = useState(availableYears[availableYears.length - 1] || '2026-27');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError('Please enter both Username and Password!');
      return;
    }

    const settings = db.getSettings();

    // Check Admin
    if (cleanUser === 'admin') {
      if (cleanPass === settings.admin_pin || cleanPass === '1234') {
        db.setSetting('active_year', selectedYear);
        onSuccess(true); // Admin Mode
      } else {
        setError('Invalid Password for Admin!');
        setPassword('');
      }
    } 
    // Check Viewer / User
    else if (cleanUser === 'user' || cleanUser === 'viewer') {
      if (cleanPass === settings.viewer_pin || cleanPass === '0000') {
        db.setSetting('active_year', selectedYear);
        onSuccess(false); // Viewer Mode
      } else {
        setError('Invalid Password for User!');
        setPassword('');
      }
    } 
    else {
      setError('Invalid Username! Use "admin" or "user"');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(circle at center, #1E293B 0%, #0F172A 70%, #020617 100%)',
      zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      {/* Ambient Glows */}
      <div style={{
        position: 'absolute', top: '15%', width: 280, height: 280,
        background: 'rgba(255, 87, 34, 0.25)', borderRadius: '50%', filter: 'blur(70px)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', width: 240, height: 240,
        background: 'rgba(255, 179, 0, 0.2)', borderRadius: '50%', filter: 'blur(70px)', pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 2 }} className="animate-fade-in">
        {/* Brand Emblem Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img
            src="./ganesh_icon.png"
            alt="Rajmudra Group Emblem"
            style={{
              width: 84, height: 84, borderRadius: 28,
              objectFit: 'cover', border: '2px solid #FFD700',
              margin: '0 auto 14px auto', boxShadow: '0 14px 40px rgba(255, 87, 34, 0.5)'
            }}
          />
          <h1 style={{ color: '#ffffff', fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>
            Rajmudra Group
          </h1>
          <p style={{ color: '#94A3B8', fontSize: 14, fontWeight: 600, marginTop: 4 }}>
            Accounts & Finance Portal
          </p>
        </div>

        {/* Login Form Container */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 28,
          padding: 24,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)'
        }}>
          <form onSubmit={handleLogin}>
            {/* Festival Year Selector (Shows ONLY available data years) */}
            <div style={{ marginBottom: 18 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 800, color: '#CBD5E1',
                marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6
              }}>
                Select Festival Year
              </label>

              <div style={{ position: 'relative' }}>
                <Calendar size={18} color="#FF9100" style={{ position: 'absolute', left: 16, top: 16 }} />
                <select
                  value={selectedYear}
                  onChange={e => { setSelectedYear(e.target.value); setError(''); }}
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 46px',
                    borderRadius: 16,
                    border: '1.5px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(15, 23, 42, 0.85)',
                    color: '#ffffff',
                    fontSize: 15,
                    fontWeight: 800,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {availableYears.map(y => (
                    <option key={y} value={y} style={{ background: '#0F172A' }}>
                      Year {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Username Input */}
            <div style={{ marginBottom: 18 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 800, color: '#CBD5E1',
                marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6
              }}>
                Username
              </label>

              <div style={{ position: 'relative' }}>
                <User size={18} color="#94A3B8" style={{ position: 'absolute', left: 16, top: 16 }} />
                <input
                  type="text"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                  placeholder="admin or user"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 46px',
                    borderRadius: 16,
                    border: '1.5px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(15, 23, 42, 0.7)',
                    color: '#ffffff',
                    fontSize: 15,
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 800, color: '#CBD5E1',
                marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6
              }}>
                Password / PIN
              </label>

              <div style={{ position: 'relative' }}>
                <Lock size={18} color="#94A3B8" style={{ position: 'absolute', left: 16, top: 16 }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter Password..."
                  style={{
                    width: '100%',
                    padding: '14px 46px 14px 46px',
                    borderRadius: 16,
                    border: '1.5px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(15, 23, 42, 0.7)',
                    color: '#ffffff',
                    fontSize: 15,
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 14, top: 14,
                    background: 'none', border: 'none', color: '#94A3B8',
                    cursor: 'pointer', display: 'flex', alignItems: 'center'
                  }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p style={{
                color: '#F87171', fontSize: 12, fontWeight: 700, marginBottom: 18,
                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '10px 14px', borderRadius: 12, textAlign: 'center', lineHeight: 1.4
              }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                borderRadius: 16,
                padding: '15px 20px',
                fontSize: 16,
                fontWeight: 900
              }}
            >
              Log In <ArrowRight size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
