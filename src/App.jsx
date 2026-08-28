import React, { useCallback, useEffect, useRef, useState } from 'react';
import PinModal from './components/PinModal';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import DonationsModule from './components/DonationsModule';
import AartiModule from './components/AartiModule';
import IncomeModule from './components/IncomeModule';
import ExpensesModule from './components/ExpensesModule';
import BankModule from './components/BankModule';
import ReportsModule from './components/ReportsModule';
import SettingsModal from './components/SettingsModal';
import PWAInstallBanner from './components/PWAInstallBanner';
import {
  DEFAULT_SETTINGS,
  fetchAvailableYears,
  fetchSettings,
  fetchYearData,
  subscribeToDataChanges
} from './services/supabase';

const TAB_ORDER = ['dashboard', 'vargani', 'jama', 'kharch', 'aarti', 'bank', 'reports'];
const YEAR_SCOPED_TABLES = new Set(['vargani', 'jama', 'kharch', 'aarti']);
const EMPTY_DATA = Object.freeze({
  year: null,
  members: [],
  vargani: [],
  jama: [],
  kharch: [],
  aarti: [],
  bank_fd: []
});
const DEFAULT_YEARS = ['2024-25', '2025-26', '2026-27'];

function sameId(left, right) {
  return String(left) === String(right);
}

function updateInMemoryData(currentData, change, activeYear) {
  const { table, eventType, record, id } = change || {};
  if (!table || !Object.prototype.hasOwnProperty.call(currentData, table) || !Array.isArray(currentData[table])) {
    return currentData;
  }

  const recordId = id ?? record?.id;
  const existingRows = currentData[table];

  if (eventType === 'DELETE') {
    return {
      ...currentData,
      [table]: existingRows.filter(row => !sameId(row.id, recordId))
    };
  }

  if (!record || recordId === undefined || recordId === null) return currentData;

  // The current screen stores only its selected fiscal year for ledger tables.
  // An update that moves a row to another year must remove it locally.
  if (YEAR_SCOPED_TABLES.has(table) && record.year !== activeYear) {
    return {
      ...currentData,
      [table]: existingRows.filter(row => !sameId(row.id, recordId))
    };
  }

  const existingIndex = existingRows.findIndex(row => sameId(row.id, recordId));
  const nextRows = existingIndex === -1
    ? [record, ...existingRows]
    : existingRows.map(row => sameId(row.id, recordId) ? record : row);

  return { ...currentData, [table]: nextRows };
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeYear, setActiveYear] = useState(DEFAULT_SETTINGS.active_year);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [availableYears, setAvailableYears] = useState(DEFAULT_YEARS);
  const [data, setData] = useState(EMPTY_DATA);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [dataError, setDataError] = useState('');

  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const activeYearRef = useRef(activeYear);
  const isAuthenticatedRef = useRef(isAuthenticated);
  const dataRequestRef = useRef(0);
  const bootstrapStartedRef = useRef(false);

  useEffect(() => {
    activeYearRef.current = activeYear;
  }, [activeYear]);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const loadYearData = useCallback(async (year = activeYearRef.current) => {
    const requestedYear = String(year || '').trim();
    if (!requestedYear) return;

    const requestId = ++dataRequestRef.current;
    setIsDataLoading(true);
    setDataError('');

    try {
      const nextData = await fetchYearData(requestedYear);
      if (requestId === dataRequestRef.current) {
        setData(nextData);
      }
    } catch (error) {
      if (requestId === dataRequestRef.current) {
        setDataError(error.message);
      }
    } finally {
      if (requestId === dataRequestRef.current) {
        setIsDataLoading(false);
      }
    }
  }, []);

  const applySettings = useCallback(async (nextSettings, { loadSelectedYear = true } = {}) => {
    const normalizedSettings = { ...DEFAULT_SETTINGS, ...(nextSettings || {}) };
    setSettings(normalizedSettings);

    const selectedYear = normalizedSettings.active_year || DEFAULT_SETTINGS.active_year;
    setAvailableYears(currentYears => [...new Set([...currentYears, selectedYear])].sort());

    if (loadSelectedYear && selectedYear !== activeYearRef.current) {
      activeYearRef.current = selectedYear;
      setActiveYear(selectedYear);
      if (isAuthenticatedRef.current) await loadYearData(selectedYear);
    }
  }, [loadYearData]);

  const refreshBootstrap = useCallback(async ({ useSavedYear = false } = {}) => {
    setIsSettingsLoading(true);
    setSettingsError('');
    try {
      const [nextSettings, years] = await Promise.all([fetchSettings(), fetchAvailableYears()]);
      setAvailableYears(years);
      await applySettings(nextSettings, { loadSelectedYear: useSavedYear });
    } catch (error) {
      setSettingsError(error.message);
    } finally {
      setIsSettingsLoading(false);
    }
  }, [applySettings]);

  useEffect(() => {
    // React StrictMode replays effects during development. Start the initial
    // bootstrap once so it does not duplicate Supabase settings/year reads.
    if (bootstrapStartedRef.current) return;
    bootstrapStartedRef.current = true;
    refreshBootstrap({ useSavedYear: true });
  }, [refreshBootstrap]);

  const handleDataChange = useCallback(async (change) => {
    if (!change) {
      await loadYearData(activeYearRef.current);
      return;
    }

    if (change.table === 'app_settings') {
      await refreshBootstrap({ useSavedYear: true });
      return;
    }

    setData(currentData => updateInMemoryData(currentData, change, activeYearRef.current));
    if (change.record?.year) {
      setAvailableYears(currentYears => [...new Set([...currentYears, change.record.year])].sort());
    }
  }, [loadYearData, refreshBootstrap]);

  // Realtime replaces the old every-five-seconds full-table polling loop. The
  // callback applies only the changed record to the in-memory view state.
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    try {
      return subscribeToDataChanges(
        ({ table, eventType, new: nextRecord, old: oldRecord }) => handleDataChange({
          table,
          eventType,
          record: nextRecord,
          id: oldRecord?.id
        }),
        {
          onError: error => setDataError(error.message)
        }
      );
    } catch (error) {
      setDataError(error.message);
      return undefined;
    }
  }, [handleDataChange, isAuthenticated]);

  useEffect(() => {
    const handlePopState = () => {
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  const handleTabChange = (newTab) => {
    if (newTab !== activeTab) {
      window.history.pushState({ tab: newTab }, '');
      setActiveTab(newTab);
    }
  };

  const handleTouchStart = (event) => {
    if (event.touches?.length === 1) {
      touchStartXRef.current = event.touches[0].clientX;
      touchStartYRef.current = event.touches[0].clientY;
    }
  };

  const handleTouchEnd = (event) => {
    if (!event.changedTouches?.length) return;

    const deltaX = event.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = event.changedTouches[0].clientY - touchStartYRef.current;
    if (Math.abs(deltaX) <= 60 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.5) return;

    const currentIndex = TAB_ORDER.indexOf(activeTab);
    if (currentIndex === -1) return;

    const nextIndex = deltaX < 0
      ? (currentIndex + 1) % TAB_ORDER.length
      : (currentIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length;
    handleTabChange(TAB_ORDER[nextIndex]);
  };

  const handlePinSuccess = async (adminFlag, selectedYear) => {
    const year = selectedYear || settings.active_year || DEFAULT_SETTINGS.active_year;
    activeYearRef.current = year;
    setActiveYear(year);
    setIsAdmin(adminFlag);
    setIsAuthenticated(true);
    await loadYearData(year);
  };

  const handleSettingsChange = async (updatedSettings) => {
    await applySettings(updatedSettings, { loadSelectedYear: true });
  };

  const handleLogout = () => {
    dataRequestRef.current += 1;
    setIsAuthenticated(false);
    setIsAdmin(false);
    setActiveTab('dashboard');
    setData(EMPTY_DATA);
    setDataError('');
  };

  if (!isAuthenticated) {
    return (
      <PinModal
        onSuccess={handlePinSuccess}
        availableYears={availableYears}
        isLoading={isSettingsLoading}
        loadError={settingsError}
        onRetry={() => refreshBootstrap({ useSavedYear: true })}
      />
    );
  }

  return (
    <div className="app-container" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <PWAInstallBanner />

      <Navbar
        isAdmin={isAdmin}
        activeYear={activeYear}
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        onOpenSettings={() => { if (isAdmin) handleTabChange('settings'); }}
        onRefresh={() => loadYearData(activeYearRef.current)}
        onLogout={handleLogout}
      />

      <main className="content-wrapper">
        {isDataLoading && (
          <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 12, background: '#EFF6FF', color: '#1D4ED8', fontSize: 13, fontWeight: 700 }}>
            Loading the latest data from Supabase…
          </div>
        )}
        {dataError && (
          <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 12, background: '#FEF2F2', color: '#B91C1C', fontSize: 13, fontWeight: 700, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
            <span>Could not refresh data: {dataError}</span>
            <button className="btn btn-secondary" onClick={() => loadYearData(activeYearRef.current)} style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}>Retry</button>
          </div>
        )}

        {activeTab === 'dashboard' && <Dashboard isAdmin={isAdmin} activeYear={activeYear} data={data} onNavigateTab={handleTabChange} />}
        {activeTab === 'vargani' && <DonationsModule isAdmin={isAdmin} activeYear={activeYear} data={data} onUpdate={handleDataChange} />}
        {activeTab === 'aarti' && <AartiModule isAdmin={isAdmin} activeYear={activeYear} data={data} onUpdate={handleDataChange} />}
        {activeTab === 'bank' && <BankModule isAdmin={isAdmin} activeYear={activeYear} data={data} onUpdate={handleDataChange} />}
        {activeTab === 'jama' && <IncomeModule isAdmin={isAdmin} activeYear={activeYear} data={data} onUpdate={handleDataChange} />}
        {activeTab === 'kharch' && <ExpensesModule isAdmin={isAdmin} activeYear={activeYear} data={data} onUpdate={handleDataChange} />}
        {activeTab === 'reports' && <ReportsModule activeYear={activeYear} data={data} />}
        {activeTab === 'settings' && (isAdmin
          ? <SettingsModal settings={settings} onClose={() => handleTabChange('dashboard')} onSettingsChange={handleSettingsChange} onUpdate={() => loadYearData(activeYearRef.current)} />
          : <Dashboard isAdmin={isAdmin} activeYear={activeYear} data={data} onNavigateTab={handleTabChange} />)}
      </main>

      <BottomNav isAdmin={isAdmin} activeTab={activeTab} onChangeTab={handleTabChange} />
    </div>
  );
}
