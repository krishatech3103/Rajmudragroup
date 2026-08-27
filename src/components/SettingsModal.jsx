import React, { useState } from 'react';
import { X, Calendar, Key, Download, Upload, Cloud, Eye, EyeOff } from 'lucide-react';
import { db } from '../services/db';
import { pushToCloud, pullFromCloud } from '../services/supabase';

export default function SettingsModal({ onClose, onUpdate }) {
  const settings = db.getSettings();

  const [activeYear, setActiveYear] = useState(settings.active_year);
  const [adminPin, setAdminPin] = useState('');
  const [viewerPin, setViewerPin] = useState('');
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [showViewerPin, setShowViewerPin] = useState(false);

  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabase_url);
  const [supabaseKey, setSupabaseKey] = useState(settings.supabase_key);
  const [showSupabaseKey, setShowSupabaseKey] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  const years = ['2024-25', '2025-26', '2026-27', '2027-28', '2028-29'];
  if (!years.includes(activeYear)) years.push(activeYear);

  const handleSaveYear = (y) => {
    db.setSetting('active_year', y);
    setActiveYear(y);
    onUpdate();
    alert(`Active year changed to ${y}`);
  };

  const handleSavePins = (e) => {
    e.preventDefault();
    let updated = false;

    if (adminPin.trim()) {
      db.setSetting('admin_pin', adminPin.trim());
      updated = true;
    }
    if (viewerPin.trim()) {
      db.setSetting('viewer_pin', viewerPin.trim());
      updated = true;
    }

    if (updated) {
      alert('Security PIN updated successfully!');
      setAdminPin('');
      setViewerPin('');
    } else {
      alert('No changes made to PINs. Current PINs remain active.');
    }
  };

  const handleExportJSON = () => {
    const data = db.exportJSON();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rajmudra_backup_${activeYear}_${Date.now()}.json`;
    a.click();
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        db.importJSON(parsed);
        alert('Backup data imported successfully!');
        onUpdate();
        onClose();
      } catch (err) {
        alert(`Import Error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveSupabase = () => {
    db.setSetting('supabase_url', supabaseUrl.trim());
    db.setSetting('supabase_key', supabaseKey.trim());
    alert('Supabase Credentials Saved!');
  };

  const handleCloudPush = async () => {
    try {
      setSyncStatus('Pushing data to Supabase...');
      await pushToCloud();
      setSyncStatus('Data Pushed Successfully! ✅');
    } catch (err) {
      setSyncStatus(`Push Failed: ${err.message}`);
    }
  };

  const handleCloudPull = async () => {
    try {
      setSyncStatus('Pulling data from Supabase...');
      await pullFromCloud();
      setSyncStatus('Data Pulled Successfully! ✅');
      onUpdate();
    } catch (err) {
      setSyncStatus(`Pull Failed: ${err.message}`);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: '#0B1329',
        zIndex: 9999,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        display: 'flex',
        flexDirection: 'column'
      }}
      className="animate-fade-in"
    >
      {/* Sticky Top Navigation Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: '#0F172A',
        color: '#ffffff',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)'
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚙️ Mandal System Settings
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            borderRadius: 10,
            padding: '6px 10px',
            cursor: 'pointer',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 800,
            fontSize: 13
          }}
        >
          <X size={18} color="#ffffff" />
          <span>Close</span>
        </button>
      </div>

      {/* Main Full-Screen Content Body */}
      <div style={{
        flex: 1,
        padding: '16px 16px 40px 16px',
        maxWidth: 640,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* 1. Year Switcher */}
        <div className="luxe-card" style={{ marginBottom: 14 }}>
          <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, color: '#FF5722' }}>
            <Calendar size={18} /> 1. Active Festival Year
          </h4>
          <select
            className="input-field"
            value={activeYear}
            onChange={e => handleSaveYear(e.target.value)}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* 2. Security PIN */}
        <div className="luxe-card" style={{ marginBottom: 14 }}>
          <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, color: '#FF5722' }}>
            <Key size={18} /> 2. Security PIN Control
          </h4>
          <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 14 }}>
            Leave fields blank if you do not want to update PINs.
          </p>

          <form onSubmit={handleSavePins}>
            <div className="input-group">
              <label className="input-label">Admin Security Key (Full Access)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showAdminPin ? 'text' : 'password'}
                  className="input-field"
                  style={{ paddingRight: 46 }}
                  value={adminPin}
                  onChange={e => setAdminPin(e.target.value)}
                  placeholder="Leave blank to keep current PIN, or enter new PIN"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPin(!showAdminPin)}
                  style={{ position: 'absolute', right: 14, top: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                >
                  {showAdminPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Viewer Key (Read-Only Access)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showViewerPin ? 'text' : 'password'}
                  className="input-field"
                  style={{ paddingRight: 46 }}
                  value={viewerPin}
                  onChange={e => setViewerPin(e.target.value)}
                  placeholder="Leave blank to keep current PIN, or enter new PIN"
                />
                <button
                  type="button"
                  onClick={() => setShowViewerPin(!showViewerPin)}
                  style={{ position: 'absolute', right: 14, top: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                >
                  {showViewerPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-secondary" style={{ padding: '10px 14px', fontSize: 13, borderRadius: 12 }}>
              Update Security PINs
            </button>
          </form>
        </div>

        {/* 3. JSON Backup & Restore & Data Reset */}
        <div className="luxe-card" style={{ marginBottom: 14 }}>
          <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, color: '#059669' }}>
            <Download size={18} /> 3. Offline JSON Backup & Data Management
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-success" onClick={handleExportJSON} style={{ padding: 12, fontSize: 13, borderRadius: 14 }}>
              <Download size={18} /> Export JSON Backup File
            </button>

            <label className="btn btn-secondary" style={{ padding: 12, fontSize: 13, borderRadius: 14, cursor: 'pointer', textAlign: 'center' }}>
              <Upload size={18} /> Import JSON Backup File
              <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
            </label>

            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete ALL records (Donations, Income, Expenses, Bank FD, Aarti)? This action cannot be undone!')) {
                  db.wipeAllData();
                  alert('All records have been completely deleted!');
                  onUpdate();
                  onClose();
                }
              }}
              style={{
                background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#DC2626', padding: 12, fontSize: 13, fontWeight: 800, borderRadius: 14,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
            >
              🗑️ Clear / Delete All Records (सर्व डेटा हटवा)
            </button>
          </div>
        </div>

        {/* 4. Supabase Cloud Sync */}
        <div className="luxe-card">
          <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, color: '#2563EB' }}>
            <Cloud size={18} /> 4. Cloud Sync (Admin Only)
          </h4>

          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
            <p style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 700, margin: '0 0 4px 0' }}>ℹ️ Supabase credentials are built into the app</p>
            <p style={{ fontSize: 11, color: '#3B82F6', fontWeight: 600, margin: 0 }}>
              No per-device setup needed. All users connect automatically.
              Use the fields below <strong>only</strong> if you need to override or migrate to a new Supabase project.
            </p>
          </div>

          <div className="input-group">
            <label className="input-label">Override Supabase URL (optional)</label>
            <input
              type="text"
              className="input-field"
              value={supabaseUrl}
              onChange={e => setSupabaseUrl(e.target.value)}
              placeholder="Leave blank to use built-in credentials"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Override Anon Key (optional)</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showSupabaseKey ? 'text' : 'password'}
                className="input-field"
                style={{ paddingRight: 46 }}
                value={supabaseKey}
                onChange={e => setSupabaseKey(e.target.value)}
                placeholder="Leave blank to use built-in credentials"
              />
              <button
                type="button"
                onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                style={{ position: 'absolute', right: 14, top: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                {showSupabaseKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button className="btn btn-secondary" onClick={handleSaveSupabase} style={{ padding: 10, fontSize: 13, borderRadius: 14, marginBottom: 10 }}>
            💾 Save Override Credentials
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={handleCloudPush} style={{ flex: 1, padding: 10, fontSize: 12, borderRadius: 12 }}>
              Push Local → Cloud ⬆
            </button>
            <button className="btn btn-secondary" onClick={handleCloudPull} style={{ flex: 1, padding: 10, fontSize: 12, borderRadius: 12 }}>
              Pull Cloud → Local ⬇
            </button>
          </div>

          {syncStatus && <p style={{ fontSize: 12, color: '#2563EB', marginTop: 8, textAlign: 'center', fontWeight: 700 }}>{syncStatus}</p>}
        </div>
      </div>
    </div>
  );
}
