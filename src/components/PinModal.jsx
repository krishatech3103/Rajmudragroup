import React, { useEffect, useState } from 'react';
import { Lock, User, Eye, EyeOff, ArrowRight, Calendar, LoaderCircle } from 'lucide-react';

// This is only a convenience value for the login form. It is not a password,
// role, session, or source of permission; Supabase Auth and RLS decide access.
const LAST_LOGIN_USERNAME_KEY = 'rajmudra_last_login_username';

function readLastLoginUsername() {
  if (typeof window === 'undefined') return '';
  try {
    return String(window.localStorage.getItem(LAST_LOGIN_USERNAME_KEY) || '').trim().toLowerCase();
  } catch {
    return '';
  }
}

function saveLastLoginUsername(username) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAST_LOGIN_USERNAME_KEY, username);
  } catch {
    // Browser storage may be unavailable; login still works normally.
  }
}

export default function PinModal({ onLogin, availableYears = [], isLoading = false, loadError = '', onRetry }) {
  const years = availableYears.length ? availableYears : ['2024-25', '2025-26', '2026-27'];
  const [rememberedUsername, setRememberedUsername] = useState(readLastLoginUsername);
  const [username, setUsername] = useState(() => readLastLoginUsername());
  const [useDifferentAccount, setUseDifferentAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [selectedYear, setSelectedYear] = useState(years[years.length - 1] || '2026-27');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);

  useEffect(() => {
    if (lockoutTime <= 0) return undefined;
    const timer = window.setInterval(() => setLockoutTime(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [lockoutTime]);

  useEffect(() => {
    if (!years.includes(selectedYear)) {
      setSelectedYear(years[years.length - 1] || '2026-27');
    }
  }, [selectedYear, years]);

  const handleLogin = async event => {
    event.preventDefault();
    if (lockoutTime > 0 || isLoading || isSubmitting) return;

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || !password) {
      setError('Enter both username and password.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await onLogin({ username: cleanUsername, password, selectedYear });
      saveLastLoginUsername(cleanUsername);
      setRememberedUsername(cleanUsername);
      setFailedAttempts(0);
    } catch (loginError) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      setPassword('');

      if (nextAttempts >= 5) {
        setLockoutTime(30);
        setFailedAttempts(0);
        setError('Too many failed attempts. Please wait 30 seconds before trying again.');
      } else {
        setError(loginError?.message || `Could not sign in. ${5 - nextAttempts} attempts remaining.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabled = lockoutTime > 0 || isLoading || isSubmitting;
  const showUsernameField = useDifferentAccount || !rememberedUsername;

  if (isLoading && !loadError) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(circle at center, #1E293B 0%, #0F172A 70%, #020617 100%)', zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }} aria-live="polite">
        <img src="./ganesh_icon.png" alt="Rajmudra Group Emblem" style={{ width: 84, height: 84, borderRadius: 28, objectFit: 'cover', border: '2px solid #FFD700', marginBottom: 20, boxShadow: '0 14px 40px rgba(255, 87, 34, 0.5)' }} />
        <LoaderCircle size={32} color="#FCD34D" style={{ animation: 'rajmudra-spin 1s linear infinite' }} />
        <p style={{ color: '#E2E8F0', fontSize: 16, fontWeight: 800, marginTop: 14 }}>Signing in…</p>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(circle at center, #1E293B 0%, #0F172A 70%, #020617 100%)',
      zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div style={{ position: 'absolute', top: '15%', width: 280, height: 280, background: 'rgba(255, 87, 34, 0.25)', borderRadius: '50%', filter: 'blur(70px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '15%', width: 240, height: 240, background: 'rgba(255, 179, 0, 0.2)', borderRadius: '50%', filter: 'blur(70px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 2 }} className="animate-fade-in">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="./ganesh_icon.png" alt="Rajmudra Group Emblem" style={{ width: 84, height: 84, borderRadius: 28, objectFit: 'cover', border: '2px solid #FFD700', margin: '0 auto 14px auto', boxShadow: '0 14px 40px rgba(255, 87, 34, 0.5)' }} />
          <h1 style={{ color: '#ffffff', fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>Rajmudra Group</h1>
          <p style={{ color: '#94A3B8', fontSize: 14, fontWeight: 600, marginTop: 4 }}>Accounts & Finance Portal</p>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 28, padding: 24, boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)' }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#CBD5E1', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>Select Festival Year</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={18} color="#FF9100" style={{ position: 'absolute', left: 16, top: 16 }} />
                <select value={selectedYear} onChange={event => { setSelectedYear(event.target.value); setError(''); }} style={{ width: '100%', padding: '14px 16px 14px 46px', borderRadius: 16, border: '1.5px solid rgba(255, 255, 255, 0.15)', background: 'rgba(15, 23, 42, 0.85)', color: '#ffffff', fontSize: 15, fontWeight: 800, outline: 'none', cursor: 'pointer' }}>
                  {years.map(year => <option key={year} value={year} style={{ background: '#0F172A' }}>Year {year}</option>)}
                </select>
              </div>
            </div>

            {showUsernameField ? (
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#CBD5E1', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>Username</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="#94A3B8" style={{ position: 'absolute', left: 16, top: 16 }} />
                  <input type="text" value={username} onChange={event => { setUsername(event.target.value); setError(''); }} placeholder="admin" autoComplete="username" autoFocus style={{ width: '100%', padding: '14px 16px 14px 46px', borderRadius: 16, border: '1.5px solid rgba(255, 255, 255, 0.15)', background: 'rgba(15, 23, 42, 0.7)', color: '#ffffff', fontSize: 15, fontWeight: 700, outline: 'none' }} />
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 16, background: 'rgba(15, 23, 42, 0.7)', color: '#E2E8F0', fontSize: 14, fontWeight: 700 }}>
                Signing in as <span style={{ color: '#FCD34D' }}>{rememberedUsername}</span>
                <button type="button" onClick={() => { setUseDifferentAccount(true); setError(''); }} style={{ display: 'block', marginTop: 7, padding: 0, background: 'none', border: 'none', color: '#67E8F9', fontWeight: 800, cursor: 'pointer' }}>Use another account</button>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#CBD5E1', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>Password / PIN</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="#94A3B8" style={{ position: 'absolute', left: 16, top: 16 }} />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={event => { setPassword(event.target.value); setError(''); }} placeholder="Enter password" autoComplete="current-password" autoFocus={!showUsernameField} style={{ width: '100%', padding: '14px 46px 14px 46px', borderRadius: 16, border: '1.5px solid rgba(255, 255, 255, 0.15)', background: 'rgba(15, 23, 42, 0.7)', color: '#ffffff', fontSize: 15, fontWeight: 700, outline: 'none' }} />
                <button type="button" onClick={() => setShowPass(value => !value)} aria-label={showPass ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: 14, top: 14, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>{showPass ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>

            {(error || loadError) && <div style={{ color: '#F87171', fontSize: 12, fontWeight: 700, marginBottom: 18, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 14px', borderRadius: 12, textAlign: 'center', lineHeight: 1.4 }}>
              <div>{error || loadError}</div>
              {loadError && onRetry && <button type="button" onClick={onRetry} disabled={isLoading} style={{ marginTop: 8, border: '1px solid rgba(248,113,113,0.55)', borderRadius: 8, background: 'transparent', color: '#FCA5A5', padding: '5px 9px', fontWeight: 800, cursor: isLoading ? 'not-allowed' : 'pointer' }}>Retry session check</button>}
            </div>}

            <button type="submit" className="btn btn-primary" disabled={disabled} style={{ width: '100%', borderRadius: 16, padding: '15px 20px', fontSize: 16, fontWeight: 900, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
              {isSubmitting || isLoading ? 'Signing in…' : lockoutTime > 0 ? `Locked Out (${lockoutTime}s)` : 'Log In'} <ArrowRight size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
