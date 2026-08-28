import React from 'react';
import { Camera, Users, Calendar, BarChart3, ShieldCheck, Download } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'live', label: 'Live Attendance', icon: Camera },
    { id: 'enrollment', label: 'Enroll Student', icon: Users },
    { id: 'sessions', label: 'Sessions', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <aside className="sidebar">
      <div>
        <div className="brand">
          <div className="brand-logo">
            <ShieldCheck size={24} color="#fff" />
          </div>
          <div>
            <h1 className="brand-title">RoRa Attendance</h1>
            <span className="brand-subtitle">Face AI System</span>
          </div>
        </div>

        <ul className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="system-status-badge">
        <div className="pulse-dot"></div>
        <span>SYSTEM ONLINE</span>
      </div>
    </aside>
  );
}
