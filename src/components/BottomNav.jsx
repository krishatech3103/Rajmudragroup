import React from 'react';
import { LayoutDashboard, HeartHandshake, ArrowDownCircle, ArrowUpCircle, Flame, Landmark, BarChart3 } from 'lucide-react';

export default function BottomNav({ activeTab, onChangeTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vargani', label: 'Donations', icon: HeartHandshake },
    { id: 'jama', label: 'Income', icon: ArrowDownCircle },
    { id: 'kharch', label: 'Expenses', icon: ArrowUpCircle },
    { id: 'aarti', label: 'Aarti 🚩', icon: Flame },
    { id: 'bank', label: 'Bank FD 🏦', icon: Landmark },
    { id: 'reports', label: 'Reports', icon: BarChart3 }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChangeTab(item.id)}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="nav-icon-wrap">
              <Icon size={20} />
            </div>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
