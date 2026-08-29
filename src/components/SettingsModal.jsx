import React, { useState } from 'react';
import { AlertTriangle, Calendar, Download, ShieldCheck, Upload } from 'lucide-react';
import { fetchExportData, fetchSettings, importData, saveSettings } from '../services/supabase';
import { validateAndSanitizeBackupData } from '../utils/security';
import CollapsibleSection from './CollapsibleSection';

export default function SettingsModal({ settings = {}, onClose, onSettingsChange, onUpdate }) {
  const [activeYear, setActiveYear] = useState(settings.active_year || '2026-27');
  const [isSavingYear, setIsSavingYear] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const years = ['2024-25', '2025-26', '2026-27', '2027-28', '2028-29'];
  if (!years.includes(activeYear)) years.push(activeYear);

  const handleSaveYear = async (year) => {
    setActiveYear(year);
    setIsSavingYear(true);
    try {
      const updatedSettings = await saveSettings({ active_year: year });
      onSettingsChange?.(updatedSettings);
      alert(`Active year changed to ${year}`);
    } catch (error) {
      alert(`Could not update the active year: ${error.message}`);
    } finally {
      setIsSavingYear(false);
    }
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const data = await fetchExportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `rajmudra_supabase_backup_${activeYear}_${Date.now()}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Could not export the Supabase backup: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportJSON = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      try {
        const rawData = JSON.parse(loadEvent.target.result);
        const data = validateAndSanitizeBackupData(rawData);

        // Older browser backups may contain PINs and local Supabase credentials.
        // They are intentionally not imported into the public settings table.
        if (rawData.settings?.active_year) {
          data.settings = { active_year: rawData.settings.active_year };
        }

        if (!confirm('Import this backup into Supabase? This is a manual restore and can intentionally re-add records that were deleted after the backup was created.')) {
          return;
        }

        setIsImporting(true);
        await importData(data);
        const updatedSettings = await fetchSettings();
        await onSettingsChange?.(updatedSettings);
        await onUpdate?.();
        alert('Backup data was imported into Supabase successfully.');
        onClose?.();
      } catch (error) {
        alert(`Import Error: ${error.message}`);
      } finally {
        setIsImporting(false);
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }} className="animate-fade-in">
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

      <div className="luxe-card" style={{ marginBottom: 14 }}>
        <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, color: '#FF5722' }}>
          <Calendar size={18} /> Active Festival Year
        </h4>
        <select
          className="input-field"
          value={activeYear}
          disabled={isSavingYear}
          onChange={event => handleSaveYear(event.target.value)}
        >
          {years.sort().map(year => <option key={year} value={year}>{year}</option>)}
        </select>
      </div>

      <div className="luxe-card" style={{ marginBottom: 14, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
        <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, color: '#92400E' }}>
          <ShieldCheck size={18} /> Access-control note
        </h4>
        <p style={{ fontSize: 12, color: '#92400E', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
          Access is controlled by Supabase Auth and server-side roles: viewers can only read, while admins can change records. Passwords and PINs are never saved in app settings or ledger data.
        </p>
      </div>

      <CollapsibleSection
        title="Supabase data backup"
        summary="Export or intentionally restore server data"
        style={{ marginBottom: 14 }}
      >
        <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 12 }}>
          Export reads the current server data. Import is an explicit server-side merge; it never writes to browser storage.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            className="btn btn-success"
            onClick={handleExportJSON}
            disabled={isExporting || isImporting}
            style={{ padding: 12, fontSize: 13, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: isExporting ? 0.7 : 1 }}
          >
            <Download size={18} /> {isExporting ? 'Exporting from Supabase…' : 'Export JSON Backup'}
          </button>
          <label
            className="btn btn-secondary"
            style={{ padding: 12, fontSize: 13, borderRadius: 14, cursor: isImporting ? 'not-allowed' : 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: isImporting ? 0.7 : 1 }}
          >
            <Upload size={18} /> {isImporting ? 'Importing to Supabase…' : 'Import JSON Backup'}
            <input type="file" accept=".json,application/json" onChange={handleImportJSON} disabled={isImporting || isExporting} style={{ display: 'none' }} />
          </label>
        </div>
      </CollapsibleSection>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#B45309', padding: '0 4px' }}>
        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        A backup is a point-in-time copy. Import it only when you deliberately want to restore its records.
      </div>
    </div>
  );
}
