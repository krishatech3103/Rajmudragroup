import React, { useState } from 'react';
import { X, Calendar, Key, Download, Upload, Cloud, ShieldCheck } from 'lucide-react';
import { db } from '../services/db';
import { pushToCloud, pullFromCloud } from '../services/supabase';

export default function SettingsModal({ onClose, onUpdate }) {
  const settings = db.getSettings();

  const [activeYear, setActiveYear] = useState(settings.active_year);
  const [adminPin, setAdminPin] = useState(settings.admin_pin);
  const [viewerPin, setViewerPin] = useState(settings.viewer_pin);
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabase_url);
  const [supabaseKey, setSupabaseKey] = useState(settings.supabase_key);
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
    if (!adminPin.trim() || !viewerPin.trim()) {
      alert('PINs / Passwords cannot be empty!');
      return;
    }
    db.setSetting('admin_pin', adminPin.trim());
    db.setSetting('viewer_pin', viewerPin.trim());
    alert('Security PINs updated successfully!');
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
          <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, color: '#FF5722' }}>
            <Key size={18} /> 2. Security PIN Control
          </h4>
          <form onSubmit={handleSavePins}>
            <div className="input-group">
              <label className="input-label">Admin Key (Full Access)</label>
              <input
                type="text"
                className="input-field"
                value={adminPin}
                onChange={e => setAdminPin(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Viewer Key (Read-Only)</label>
              <input
                type="text"
                className="input-field"
                value={viewerPin}
                onChange={e => setViewerPin(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ padding: '10px 14px', fontSize: 13, borderRadius: 12 }}>
              Update Security PINs
            </button>
          </form>
        </div>

        {/* 3. JSON Backup & Restore */}
        <div className="luxe-card" style={{ marginBottom: 14 }}>
          <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, color: '#059669' }}>
            <Download size={18} /> 3. Offline JSON Backup & Restore
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-success" onClick={handleExportJSON} style={{ padding: 12, fontSize: 13, borderRadius: 14 }}>
              <Download size={18} /> Export JSON Backup File
            </button>

            <label className="btn btn-secondary" style={{ padding: 12, fontSize: 13, borderRadius: 14, cursor: 'pointer', textAlign: 'center' }}>
              <Upload size={18} /> Import JSON Backup File
              <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
            </label>
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
            <input
              type="password"
              className="input-field"
              value={supabaseKey}
              onChange={e => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGci..."
            />
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
