import React from 'react';
import { LayoutDashboard, HeartHandshake, ArrowDownCircle, ArrowUpCircle, BarChart3, Flame } from 'lucide-react';

export default function BottomNav({ activeTab, onChangeTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vargani', label: 'Donations', icon: HeartHandshake },
    { id: 'aarti', label: 'Aarti 🚩', icon: Flame },
    { id: 'jama', label: 'Income', icon: ArrowDownCircle },
    { id: 'kharch', label: 'Expenses', icon: ArrowUpCircle },
    { id: 'reports', label: 'Reports', icon: BarChart3 }
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="nav-icon-wrap">
              <Icon size={20} color={isActive ? '#E65100' : '#64748B'} />
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
