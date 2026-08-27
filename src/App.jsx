import React, { useState, useEffect, useRef } from 'react';
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

const TAB_ORDER = ['dashboard', 'vargani', 'jama', 'kharch', 'aarti', 'bank', 'reports'];

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

  // Swipe Gesture Tracking
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

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

  // Swipe Left / Right to Move Between Tabs
  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e) => {
    if (!e.changedTouches || e.changedTouches.length === 0) return;

    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Check if swipe is horizontal and prominent (> 60px)
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      const currentIndex = TAB_ORDER.indexOf(activeTab);
      if (currentIndex === -1) return;

      if (deltaX < -60) {
        // Swipe Left -> Next Tab
        const nextIndex = (currentIndex + 1) % TAB_ORDER.length;
        handleTabChange(TAB_ORDER[nextIndex]);
      } else if (deltaX > 60) {
        // Swipe Right -> Previous Tab
        const prevIndex = (currentIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length;
        handleTabChange(TAB_ORDER[prevIndex]);
      }
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

  const handleLogout = () => {
    sessionStorage.removeItem('rajmudra_auth');
    sessionStorage.removeItem('rajmudra_is_admin');
    sessionStorage.removeItem('rajmudra_active_tab');
    setIsAuthenticated(false);
    setIsAdmin(false);
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
    <div
      className="app-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <PWAInstallBanner />

      <Navbar
        isAdmin={isAdmin}
        activeYear={activeYear}
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        onOpenSettings={handleOpenSettings}
        onRefresh={handleRefresh}
        onLogout={handleLogout}
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

      <BottomNav isAdmin={isAdmin} activeTab={activeTab} onChangeTab={handleTabChange} />

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onUpdate={handleRefresh}
        />
      )}
    </div>
  );
}
