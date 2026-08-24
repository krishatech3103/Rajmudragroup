import React, { useState, useEffect } from 'react';
import { db } from './services/db';
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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('rajmudra_auth') === 'true';
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem('rajmudra_is_admin') === 'true';
  });
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('rajmudra_active_tab') || 'dashboard';
  });
  const [activeYear, setActiveYear] = useState('2026-27');
  const [showSettings, setShowSettings] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const s = db.getSettings();
    setActiveYear(s.active_year || '2026-27');
  }, [refreshKey]);

  // Mobile Hardware Back Button Support (popstate navigation)
  useEffect(() => {
    const handlePopState = (e) => {
      if (showSettings) {
        setShowSettings(false);
        return;
      }
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
        sessionStorage.setItem('rajmudra_active_tab', 'dashboard');
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showSettings, activeTab]);

  const handleTabChange = (newTab) => {
    if (newTab !== activeTab) {
      sessionStorage.setItem('rajmudra_active_tab', newTab);
      window.history.pushState({ tab: newTab }, '');
      setActiveTab(newTab);
    }
  };

  const handleOpenSettings = () => {
    window.history.pushState({ modal: 'settings' }, '');
    setShowSettings(true);
  };

  const handlePinSuccess = (adminFlag) => {
    setIsAdmin(adminFlag);
    setIsAuthenticated(true);
    sessionStorage.setItem('rajmudra_auth', 'true');
    sessionStorage.setItem('rajmudra_is_admin', adminFlag ? 'true' : 'false');
    const s = db.getSettings();
    setActiveYear(s.active_year || '2026-27');
  };

  const handleRefresh = () => {
    const s = db.getSettings();
    setActiveYear(s.active_year || '2026-27');
    setRefreshKey(prev => prev + 1);
  };

  if (!isAuthenticated) {
    return <PinModal onSuccess={handlePinSuccess} />;
  }

  return (
    <div className="app-container">
      <PWAInstallBanner />

      <Navbar
        isAdmin={isAdmin}
        activeYear={activeYear}
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        onOpenSettings={handleOpenSettings}
        onRefresh={handleRefresh}
        onYearChange={(y) => setActiveYear(y)}
      />

      <main key={refreshKey} className="content-wrapper">
        {activeTab === 'dashboard' && <Dashboard isAdmin={isAdmin} activeYear={activeYear} onUpdate={handleRefresh} onNavigateTab={handleTabChange} />}
        {activeTab === 'vargani' && <DonationsModule isAdmin={isAdmin} activeYear={activeYear} onUpdate={handleRefresh} />}
        {activeTab === 'aarti' && <AartiModule isAdmin={isAdmin} activeYear={activeYear} onUpdate={handleRefresh} />}
        {activeTab === 'bank' && <BankModule isAdmin={isAdmin} activeYear={activeYear} onUpdate={handleRefresh} />}
        {activeTab === 'jama' && <IncomeModule isAdmin={isAdmin} activeYear={activeYear} onUpdate={handleRefresh} />}
        {activeTab === 'kharch' && <ExpensesModule isAdmin={isAdmin} activeYear={activeYear} onUpdate={handleRefresh} />}
        {activeTab === 'reports' && <ReportsModule activeYear={activeYear} />}
      </main>

      <BottomNav activeTab={activeTab} onChangeTab={handleTabChange} />

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onUpdate={handleRefresh}
        />
      )}
    </div>
  );
}
