import React, { useState } from 'react';
import { AlertTriangle, Calendar, Check, Download, Pencil, Plus, ShieldCheck, Trash2, Upload, X } from 'lucide-react';
import { countCategoryUsage, fetchExportData, fetchSettings, importData, renameCategoryRecords, saveSettings } from '../services/supabase';
import { validateAndSanitizeBackupData } from '../utils/security';
import CollapsibleSection from './CollapsibleSection';
import { getExpenseCategories, getIncomeCategories } from '../utils/categories';

export default function SettingsModal({ settings = {}, onClose, onSettingsChange, onUpdate }) {
  const [activeYear, setActiveYear] = useState(settings.active_year || '2026-27');
  const [isSavingYear, setIsSavingYear] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [newCategory, setNewCategory] = useState({ income: '', expense: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const incomeCategories = getIncomeCategories(settings);
  const expenseCategories = getExpenseCategories(settings);
  const categoryConfig = {
    income: { label: 'Income categories', settingKey: 'income_categories', table: 'jama', categories: incomeCategories, color: '#059669' },
    expense: { label: 'Expense categories', settingKey: 'expense_categories', table: 'kharch', categories: expenseCategories, color: '#DC2626' }
  };

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

  const saveManagedCategories = async (type, categories) => {
    const config = categoryConfig[type];
    const updatedSettings = await saveSettings({ [config.settingKey]: categories });
    await onSettingsChange?.(updatedSettings);
  };

  const handleAddCategory = async (type) => {
    const config = categoryConfig[type];
    const value = newCategory[type].trim();
    if (!value) {
      alert('Enter a category name.');
      return;
    }
    if (config.categories.some(category => category.toLowerCase() === value.toLowerCase())) {
      alert('This category already exists.');
      return;
    }

    setIsSavingCategory(true);
    try {
      await saveManagedCategories(type, [...config.categories, value]);
      setNewCategory(current => ({ ...current, [type]: '' }));
    } catch (error) {
      alert(`Could not add the category: ${error.message}`);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleRenameCategory = async (type) => {
    const config = categoryConfig[type];
    const previousName = editingCategory?.name || '';
    const nextName = editingCategory?.value?.trim() || '';
    if (!nextName) {
      alert('Enter a category name.');
      return;
    }
    if (nextName.toLowerCase() !== previousName.toLowerCase() && config.categories.some(category => category.toLowerCase() === nextName.toLowerCase())) {
      alert('This category already exists.');
      return;
    }
    if (nextName === previousName) {
      setEditingCategory(null);
      return;
    }

    setIsSavingCategory(true);
    let recordsRenamed = false;
    try {
      const usage = await countCategoryUsage(config.table, previousName);
      if (usage > 0) {
        await renameCategoryRecords(config.table, previousName, nextName);
        recordsRenamed = true;
      }
      await saveManagedCategories(type, config.categories.map(category => category === previousName ? nextName : category));
      if (recordsRenamed) await onUpdate?.();
      setEditingCategory(null);
    } catch (error) {
      if (recordsRenamed) {
        await renameCategoryRecords(config.table, nextName, previousName).catch(() => undefined);
      }
      alert(`Could not update the category: ${error.message}`);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (type, category) => {
    const config = categoryConfig[type];
    if (config.categories.length <= 1) {
      alert(`Keep at least one ${type} category for new entries.`);
      return;
    }
    if (!confirm(`Delete the category "${category}"? It can be deleted only when no ${type} entries use it.`)) return;

    setIsSavingCategory(true);
    try {
      const usage = await countCategoryUsage(config.table, category);
      if (usage > 0) {
        alert(`Cannot delete "${category}" because ${usage} ${type} entr${usage === 1 ? 'y' : 'ies'} still use it.`);
        return;
      }
      await saveManagedCategories(type, config.categories.filter(item => item !== category));
    } catch (error) {
      alert(`Could not delete the category: ${error.message}`);
    } finally {
      setIsSavingCategory(false);
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
      anchor.download = `rajmudra_backup_${activeYear}_${Date.now()}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Could not export the backup: ${error.message}`);
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

        if (!confirm('Import this backup? This is a manual restore and can intentionally re-add records that were deleted after the backup was created.')) {
          return;
        }

        setIsImporting(true);
        await importData(data);
        const updatedSettings = await fetchSettings();
        await onSettingsChange?.(updatedSettings);
        await onUpdate?.();
        alert('Backup data was imported successfully.');
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

      <CollapsibleSection
        title="Manage categories"
        summary="Add, rename, or remove Income and Expense categories"
        style={{ marginBottom: 14 }}
      >
        <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, margin: '0 0 14px 0', lineHeight: 1.5 }}>
          Renaming updates all entries that use the category. A category can be deleted only when no entries use it.
        </p>

        {Object.entries(categoryConfig).map(([type, config]) => (
          <div key={type} style={{ marginTop: type === 'income' ? 0 : 18, paddingTop: type === 'income' ? 0 : 18, borderTop: type === 'income' ? 'none' : '1px solid #E2E8F0' }}>
            <h4 style={{ fontSize: 14, fontWeight: 900, color: config.color, margin: '0 0 10px 0' }}>{config.label}</h4>

            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                className="input-field"
                value={newCategory[type]}
                onChange={event => setNewCategory(current => ({ ...current, [type]: event.target.value }))}
                placeholder={`Add ${type} category`}
                maxLength={80}
                disabled={isSavingCategory}
                style={{ flex: 1, minWidth: 0 }}
              />
              <button
                type="button"
                onClick={() => handleAddCategory(type)}
                disabled={isSavingCategory}
                title={`Add ${type} category`}
                style={{ width: 46, border: 'none', borderRadius: 12, background: config.color, color: '#ffffff', cursor: isSavingCategory ? 'not-allowed' : 'pointer', opacity: isSavingCategory ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Plus size={19} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {config.categories.map(category => {
                const isEditing = editingCategory?.type === type && editingCategory?.name === category;
                return (
                  <div key={category} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    {isEditing ? (
                      <input
                        className="input-field"
                        value={editingCategory.value}
                        onChange={event => setEditingCategory(current => ({ ...current, value: event.target.value }))}
                        maxLength={80}
                        autoFocus
                        style={{ flex: 1, minWidth: 0, padding: '7px 9px', fontSize: 13 }}
                      />
                    ) : (
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: '#334155', overflowWrap: 'anywhere' }}>{category}</span>
                    )}

                    {isEditing ? (
                      <>
                        <button type="button" onClick={() => handleRenameCategory(type)} disabled={isSavingCategory} title="Save category name" style={{ border: 'none', background: '#DCFCE7', color: '#15803D', borderRadius: 9, width: 32, height: 32, cursor: isSavingCategory ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={16} /></button>
                        <button type="button" onClick={() => setEditingCategory(null)} disabled={isSavingCategory} title="Cancel" style={{ border: 'none', background: '#F1F5F9', color: '#475569', borderRadius: 9, width: 32, height: 32, cursor: isSavingCategory ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => setEditingCategory({ type, name: category, value: category })} disabled={isSavingCategory} title="Rename category" style={{ border: 'none', background: '#FEF3C7', color: '#B45309', borderRadius: 9, width: 32, height: 32, cursor: isSavingCategory ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={15} /></button>
                        <button type="button" onClick={() => handleDeleteCategory(type, category)} disabled={isSavingCategory} title="Delete category" style={{ border: 'none', background: '#FEE2E2', color: '#B91C1C', borderRadius: 9, width: 32, height: 32, cursor: isSavingCategory ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={15} /></button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CollapsibleSection>

      <div className="luxe-card" style={{ marginBottom: 14, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
        <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, color: '#92400E' }}>
          <ShieldCheck size={18} /> Access-control note
        </h4>
        <p style={{ fontSize: 12, color: '#92400E', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
          Access is controlled by secure sign-in and server-side roles: viewers can only read, while admins can change records. Passwords and PINs are never saved in app settings or ledger data.
        </p>
      </div>

      <CollapsibleSection
        title="Data backup"
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
            <Download size={18} /> {isExporting ? 'Exporting backup…' : 'Export JSON Backup'}
          </button>
          <label
            className="btn btn-secondary"
            style={{ padding: 12, fontSize: 13, borderRadius: 14, cursor: isImporting ? 'not-allowed' : 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: isImporting ? 0.7 : 1 }}
          >
            <Upload size={18} /> {isImporting ? 'Importing backup…' : 'Import JSON Backup'}
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
