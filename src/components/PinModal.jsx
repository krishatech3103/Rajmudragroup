import React, { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, ArrowRight, Calendar } from 'lucide-react';

const LEGACY_ROLE_PINS = Object.freeze({
  admin: '1234',
  viewer: '0000'
});

export default function PinModal({ onSuccess, availableYears = [], isLoading = false, loadError = '', onRetry }) {
  const years = availableYears.length ? availableYears : ['2024-25', '2025-26', '2026-27'];
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedYear, setSelectedYear] = useState(years[years.length - 1] || '2026-27');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  // Brute-force rate limiting state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);

  useEffect(() => {
    let timer;
    if (lockoutTime > 0) {
      timer = setInterval(() => {
        setLockoutTime(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTime]);

  useEffect(() => {
    if (!years.includes(selectedYear)) {
      setSelectedYear(years[years.length - 1] || '2026-27');
    }
  }, [selectedYear, years]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (lockoutTime > 0 || isLoading || loadError) return;

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError('Please enter both Username and Password!');
      return;
    }

    // Check Admin
    if (cleanUser === 'admin') {
      if (cleanPass === LEGACY_ROLE_PINS.admin) {
        onSuccess(true, selectedYear); // Admin Mode
        return;
      }
    } 
    // Check Viewer / User
    else if (cleanUser === 'user' || cleanUser === 'viewer') {
      if (cleanPass === LEGACY_ROLE_PINS.viewer) {
        onSuccess(false, selectedYear); // Viewer Mode
        return;
      }
    } 

    // Handle Failed Attempt
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    setPassword('');

    if (newAttempts >= 5) {
      setLockoutTime(30);
      setFailedAttempts(0);
      setError('Too many failed attempts! Security lockout active for 30 seconds.');
    } else {
      setError(`Invalid credentials! (${5 - newAttempts} attempts remaining)`);
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
                  {years.map(y => (
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

            {(error || loadError) && (
              <div style={{
                color: '#F87171', fontSize: 12, fontWeight: 700, marginBottom: 18,
                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '10px 14px', borderRadius: 12, textAlign: 'center', lineHeight: 1.4
              }}>
                <div>{loadError || error}</div>
                {loadError && onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    disabled={isLoading}
                    style={{ marginTop: 8, border: '1px solid rgba(248,113,113,0.55)', borderRadius: 8, background: 'transparent', color: '#FCA5A5', padding: '5px 9px', fontWeight: 800, cursor: isLoading ? 'not-allowed' : 'pointer' }}
                  >
                    Retry connection
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={lockoutTime > 0 || isLoading || !!loadError}
              style={{
                width: '100%',
                borderRadius: 16,
                padding: '15px 20px',
                fontSize: 16,
                fontWeight: 900,
                opacity: lockoutTime > 0 || isLoading || loadError ? 0.5 : 1,
                cursor: lockoutTime > 0 || isLoading || loadError ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? 'Connecting to Supabase…' : lockoutTime > 0 ? `Locked Out (${lockoutTime}s)` : 'Log In'} <ArrowRight size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
