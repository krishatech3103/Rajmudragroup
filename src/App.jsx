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
import ReportsModule from './components/ReportsModule';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeYear, setActiveYear] = useState('2026-27');
  const [showSettings, setShowSettings] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const s = db.getSettings();
    setActiveYear(s.active_year || '2026-27');
  }, [refreshKey]);

  const handlePinSuccess = (adminFlag) => {
    setIsAdmin(adminFlag);
    setIsAuthenticated(true);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!isAuthenticated) {
    return <PinModal onSuccess={handlePinSuccess} />;
  }

  return (
    <div className="app-container">
      <Navbar
        isAdmin={isAdmin}
        activeYear={activeYear}
        onOpenSettings={() => setShowSettings(true)}
        onRefresh={handleRefresh}
      />

      <main key={refreshKey} className="content-wrapper">
        {activeTab === 'dashboard' && <Dashboard activeYear={activeYear} />}
        {activeTab === 'vargani' && <DonationsModule isAdmin={isAdmin} activeYear={activeYear} onUpdate={handleRefresh} />}
        {activeTab === 'aarti' && <AartiModule isAdmin={isAdmin} activeYear={activeYear} onUpdate={handleRefresh} />}
        {activeTab === 'jama' && <IncomeModule isAdmin={isAdmin} activeYear={activeYear} onUpdate={handleRefresh} />}
        {activeTab === 'kharch' && <ExpensesModule isAdmin={isAdmin} activeYear={activeYear} onUpdate={handleRefresh} />}
        {activeTab === 'reports' && <ReportsModule activeYear={activeYear} />}
      </main>

      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onUpdate={handleRefresh}
        />
      )}
    </div>
  );
}
