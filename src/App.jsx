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
  restoreAuthenticatedUser,
  signInWithUsername,
  signOut,
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
const AUTH_TIMEOUT_MS = 30 * 60 * 1000;
const AUTH_LAST_ACTIVE_AT_KEY = 'rajmudra_auth_last_active_at';

function readLastAuthActivity() {
  if (typeof window === 'undefined') return 0;
  try {
    const timestamp = Number(window.localStorage.getItem(AUTH_LAST_ACTIVE_AT_KEY));
    return Number.isFinite(timestamp) ? timestamp : 0;
  } catch {
    return 0;
  }
}

function saveLastAuthActivity() {
  if (typeof window === 'undefined') return;
  try {
    // This timestamp is authentication-only. No password or financial data is stored here.
    window.localStorage.setItem(AUTH_LAST_ACTIVE_AT_KEY, String(Date.now()));
  } catch {
    // Browser storage may be unavailable; the server session continues normally.
  }
}

function clearLastAuthActivity() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(AUTH_LAST_ACTIVE_AT_KEY);
  } catch {
    // Browser storage may be unavailable.
  }
}

function hasAuthTimedOut() {
  const lastActivity = readLastAuthActivity();
  return lastActivity > 0 && Date.now() - lastActivity >= AUTH_TIMEOUT_MS;
}

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
  const [donationFilter, setDonationFilter] = useState('all');
  const [activeYear, setActiveYear] = useState(DEFAULT_SETTINGS.active_year);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [availableYears, setAvailableYears] = useState(DEFAULT_YEARS);
  const [data, setData] = useState(EMPTY_DATA);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  // Start true so a newly authenticated user never begins a ledger request
  // before their server-selected festival year has been loaded.
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [dataError, setDataError] = useState('');

  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const activeYearRef = useRef(activeYear);
  const dataRequestRef = useRef(0);
  const bootstrapStartedRef = useRef(false);
  const availableYearsLoadedRef = useRef(false);
  const ignorePageSwipeRef = useRef(false);
  const selectedLoginYearRef = useRef('');

  useEffect(() => {
    activeYearRef.current = activeYear;
  }, [activeYear]);

  const restoreSecureSession = useCallback(async () => {
    setIsAuthLoading(true);
    setAuthError('');
    try {
      if (hasAuthTimedOut()) {
        clearLastAuthActivity();
        await signOut({ scope: 'local' }).catch(() => undefined);
        return;
      }

      const identity = await restoreAuthenticatedUser();
      if (!identity) return;
      saveLastAuthActivity();
      setIsAdmin(identity.role === 'admin');
      setIsAuthenticated(true);
    } catch (error) {
      setAuthError(error.message || 'Could not restore the secure login session.');
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    void restoreSecureSession();
  }, [restoreSecureSession]);

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

  const applySettings = useCallback((nextSettings, { loadSelectedYear = true } = {}) => {
    const normalizedSettings = { ...DEFAULT_SETTINGS, ...(nextSettings || {}) };
    setSettings(normalizedSettings);

    const selectedYear = normalizedSettings.active_year || DEFAULT_SETTINGS.active_year;
    setAvailableYears(currentYears => [...new Set([...currentYears, selectedYear])].sort());

    if (loadSelectedYear && selectedYear !== activeYearRef.current) {
      activeYearRef.current = selectedYear;
      setActiveYear(selectedYear);
    }
  }, []);

  const refreshBootstrap = useCallback(async ({ useSavedYear = false } = {}) => {
    setIsSettingsLoading(true);
    setSettingsError('');
    try {
      // Settings is one small record and is needed immediately. The historic
      // year scan is intentionally loaded later, after the active ledger is
      // on-screen; waiting for every table here made startup feel slow.
      const nextSettings = await fetchSettings();
      await applySettings(nextSettings, { loadSelectedYear: useSavedYear });
    } catch (error) {
      setSettingsError(error.message);
      setDataError(error.message);
      setIsDataLoading(false);
    } finally {
      setIsSettingsLoading(false);
    }
  }, [applySettings]);

  useEffect(() => {
    // No ledger/settings request is made until Supabase Auth has verified the
    // user and their database role. This keeps permissions server-authoritative.
    if (!isAuthenticated || bootstrapStartedRef.current) return;
    bootstrapStartedRef.current = true;
    const hasLoginYear = Boolean(selectedLoginYearRef.current);
    selectedLoginYearRef.current = '';
    refreshBootstrap({ useSavedYear: !hasLoginYear });
  }, [isAuthenticated, refreshBootstrap]);

  // Rehydrate a kept tab session with a fresh Supabase read after settings
  // finish loading. New logins use this same path, so no page refresh can
  // display old in-memory ledger data.
  useEffect(() => {
    if (!isAuthenticated || isSettingsLoading || settingsError) return;
    loadYearData(activeYearRef.current);
  }, [activeYear, isAuthenticated, isSettingsLoading, loadYearData, settingsError]);

  // The year selector is useful, but deriving it previously read every row
  // from every ledger table before the app could render. Load it once in the
  // background after the active year's data has arrived.
  useEffect(() => {
    if (
      !isAuthenticated ||
      isSettingsLoading ||
      isDataLoading ||
      data.year !== activeYear ||
      availableYearsLoadedRef.current
    ) return;

    availableYearsLoadedRef.current = true;
    fetchAvailableYears()
      .then(years => setAvailableYears(years))
      .catch(() => {
        // Keep the default/settings years and permit the next data refresh to retry.
        availableYearsLoadedRef.current = false;
      });
  }, [activeYear, data.year, isAuthenticated, isDataLoading, isSettingsLoading]);

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
  // A transient mobile WebSocket failure must not be presented as a failed
  // data read—the last successful Supabase data remains valid and the client
  // reconnects independently.
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
          onError: error => console.warn('Supabase Realtime is temporarily unavailable:', error)
        }
      );
    } catch (error) {
      console.warn('Could not start Supabase Realtime:', error);
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

  const handleTabChange = (newTab, options = {}) => {
    if (newTab === 'vargani') {
      setDonationFilter(options.donationFilter === 'pending' || options.donationFilter === 'paid'
        ? options.donationFilter
        : 'all');
    }
    if (newTab !== activeTab) {
      window.history.pushState({ tab: newTab }, '');
      setActiveTab(newTab);
    }
  };

  const handleTouchStart = (event) => {
    const target = event.target;
    ignorePageSwipeRef.current = Boolean(
      target?.closest?.('[data-disable-page-swipe="true"]')
    );

    if (ignorePageSwipeRef.current) return;

    if (event.touches?.length === 1) {
      touchStartXRef.current = event.touches[0].clientX;
      touchStartYRef.current = event.touches[0].clientY;
    }
  };

  const handleTouchEnd = (event) => {
    if (ignorePageSwipeRef.current) {
      ignorePageSwipeRef.current = false;
      return;
    }

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

  const handleTouchCancel = () => {
    ignorePageSwipeRef.current = false;
  };

  const handleLogin = async ({ username, password, selectedYear }) => {
    const identity = await signInWithUsername(username, password);
    saveLastAuthActivity();
    const year = selectedYear || settings.active_year || DEFAULT_SETTINGS.active_year;
    activeYearRef.current = year;
    selectedLoginYearRef.current = year;
    setActiveYear(year);
    setIsAdmin(identity.role === 'admin');
    setIsDataLoading(true);
    setIsAuthenticated(true);
  };

  const handleSettingsChange = async (updatedSettings) => {
    await applySettings(updatedSettings, { loadSelectedYear: true });
  };

  const handleLogout = useCallback(({ localOnly = false } = {}) => {
    dataRequestRef.current += 1;
    void signOut(localOnly ? { scope: 'local' } : undefined).catch(error => {
      // The local UI is already locked. This warning helps diagnose a network
      // failure without exposing any ledger state after a manual logout.
      console.warn('Could not notify Supabase about logout:', error);
    });
    clearLastAuthActivity();
    bootstrapStartedRef.current = false;
    availableYearsLoadedRef.current = false;
    selectedLoginYearRef.current = '';
    setIsAuthenticated(false);
    setIsAdmin(false);
    setActiveTab('dashboard');
    setData(EMPTY_DATA);
    setDataError('');
    setSettingsError('');
    setIsSettingsLoading(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let hasEndedSession = false;
    const endExpiredSession = () => {
      if (hasEndedSession || !hasAuthTimedOut()) return;
      hasEndedSession = true;
      handleLogout({ localOnly: true });
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveLastAuthActivity();
        return;
      }

      endExpiredSession();
      if (!hasEndedSession) saveLastAuthActivity();
    };
    const recordLastActiveTime = () => saveLastAuthActivity();
    const activityTimer = window.setInterval(recordLastActiveTime, 60 * 1000);

    saveLastAuthActivity();
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', recordLastActiveTime);
    return () => {
      window.clearInterval(activityTimer);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', recordLastActiveTime);
    };
  }, [handleLogout, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <PinModal
        onLogin={handleLogin}
        availableYears={availableYears}
        isLoading={isAuthLoading}
        loadError={authError}
        onRetry={restoreSecureSession}
      />
    );
  }

  return (
    <div className="app-container" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchCancel}>
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
            Loading the latest data…
          </div>
        )}
        {dataError && (
          <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 12, background: '#FEF2F2', color: '#B91C1C', fontSize: 13, fontWeight: 700, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
            <span>Could not refresh data: {dataError}</span>
            <button className="btn btn-secondary" onClick={() => loadYearData(activeYearRef.current)} style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}>Retry</button>
          </div>
        )}

        {activeTab === 'dashboard' && <Dashboard isAdmin={isAdmin} activeYear={activeYear} data={data} onUpdate={handleDataChange} onNavigateTab={handleTabChange} />}
        {activeTab === 'vargani' && <DonationsModule isAdmin={isAdmin} activeYear={activeYear} data={data} onUpdate={handleDataChange} initialFilter={donationFilter} />}
        {activeTab === 'aarti' && <AartiModule isAdmin={isAdmin} activeYear={activeYear} data={data} onUpdate={handleDataChange} />}
        {activeTab === 'bank' && <BankModule isAdmin={isAdmin} activeYear={activeYear} data={data} onUpdate={handleDataChange} />}
        {activeTab === 'jama' && <IncomeModule isAdmin={isAdmin} activeYear={activeYear} data={data} settings={settings} onUpdate={handleDataChange} />}
        {activeTab === 'kharch' && <ExpensesModule isAdmin={isAdmin} activeYear={activeYear} data={data} settings={settings} onUpdate={handleDataChange} />}
        {activeTab === 'reports' && <ReportsModule activeYear={activeYear} data={data} />}
        {activeTab === 'settings' && (isAdmin
          ? <SettingsModal settings={settings} onClose={() => handleTabChange('dashboard')} onSettingsChange={handleSettingsChange} onUpdate={() => loadYearData(activeYearRef.current)} />
          : <Dashboard isAdmin={isAdmin} activeYear={activeYear} data={data} onUpdate={handleDataChange} onNavigateTab={handleTabChange} />)}
      </main>

      <BottomNav isAdmin={isAdmin} activeTab={activeTab} onChangeTab={handleTabChange} />
    </div>
  );
}
