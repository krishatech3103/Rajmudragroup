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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-pill" />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>Mandal System Settings</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={22} color="#64748B" />
          </button>
        </div>

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
          <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, color: '#2563EB' }}>
            <Cloud size={18} /> 4. Supabase Cloud Sync
          </h4>
          <div className="input-group">
            <label className="input-label">Supabase Project URL</label>
            <input
              type="text"
              className="input-field"
              value={supabaseUrl}
              onChange={e => setSupabaseUrl(e.target.value)}
              placeholder="https://xyz.supabase.co"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Supabase Anon Key</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showSupabaseKey ? 'text' : 'password'}
                className="input-field"
                style={{ paddingRight: 46 }}
                value={supabaseKey}
                onChange={e => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGci..."
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

          <button className="btn btn-primary" onClick={handleSaveSupabase} style={{ padding: 10, fontSize: 13, borderRadius: 14, marginBottom: 10 }}>
            Save Credentials
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={handleCloudPush} style={{ flex: 1, padding: 10, fontSize: 12, borderRadius: 12 }}>
              Cloud Push ⬆
            </button>
            <button className="btn btn-secondary" onClick={handleCloudPull} style={{ flex: 1, padding: 10, fontSize: 12, borderRadius: 12 }}>
              Cloud Pull ⬇
            </button>
          </div>

          {syncStatus && <p style={{ fontSize: 12, color: '#2563EB', marginTop: 8, textAlign: 'center', fontWeight: 700 }}>{syncStatus}</p>}
        </div>
      </div>
    </div>
  );
}
