import React, { useState } from 'react';
import { Calendar, Key, Download, Upload, Eye, EyeOff } from 'lucide-react';
import { db } from '../services/db';

export default function SettingsModal({ onClose, onUpdate }) {
  const settings = db.getSettings();

  const [activeYear, setActiveYear] = useState(settings.active_year);
  const [adminPin, setAdminPin] = useState('');
  const [viewerPin, setViewerPin] = useState('');
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [showViewerPin, setShowViewerPin] = useState(false);

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
    if (adminPin.trim()) { db.setSetting('admin_pin', adminPin.trim()); updated = true; }
    if (viewerPin.trim()) { db.setSetting('viewer_pin', viewerPin.trim()); updated = true; }
    if (updated) {
      alert('Security PIN updated successfully!');
      setAdminPin('');
      setViewerPin('');
    } else {
      alert('No changes made. Current PINs remain active.');
    }
  };

  const handleExportJSON = () => {
    const data = db.exportJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
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

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }} className="animate-fade-in">

      {/* Page Banner — same style as other modules */}
      <div style={{
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #9333EA 100%)',
        color: '#ffffff',
        padding: '16px 18px',
        borderRadius: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 14,
        boxShadow: '0 12px 30px rgba(124, 58, 237, 0.35)'
      }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 17, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚙️ Mandal Settings
          </h2>
          <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 600, display: 'block', marginTop: 2 }}>
            Festival Year {activeYear}
          </span>
        </div>
      </div>

      {/* 1. Active Festival Year */}
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

      {/* 2. Security PINs */}
      <div className="luxe-card" style={{ marginBottom: 14 }}>
        <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, color: '#FF5722' }}>
          <Key size={18} /> 2. Security PIN Control
        </h4>
        <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 14 }}>
          Leave blank to keep current PINs unchanged.
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
                placeholder="Leave blank to keep current PIN"
              />
              <button type="button" onClick={() => setShowAdminPin(!showAdminPin)}
                style={{ position: 'absolute', right: 14, top: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
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
                placeholder="Leave blank to keep current PIN"
              />
              <button type="button" onClick={() => setShowViewerPin(!showViewerPin)}
                style={{ position: 'absolute', right: 14, top: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                {showViewerPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-secondary" style={{ padding: '10px 14px', fontSize: 13, borderRadius: 12 }}>
            Update Security PINs
          </button>
        </form>
      </div>

      {/* 3. Year-End Backup */}
      <div className="luxe-card" style={{ marginBottom: 14 }}>
        <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, color: '#059669' }}>
          <Download size={18} /> 3. Year-End Data Backup
        </h4>
        <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 12 }}>
          Export all data at the end of the festival year. Import next year to restore records.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn btn-success" onClick={handleExportJSON}
            style={{ padding: 12, fontSize: 13, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Download size={18} /> Export JSON Backup
          </button>
          <label className="btn btn-secondary"
            style={{ padding: 12, fontSize: 13, borderRadius: 14, cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Upload size={18} /> Import JSON Backup
            <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

    </div>
  );
}
