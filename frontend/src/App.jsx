import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import LiveAttendance from './pages/LiveAttendance';
import Enrollment from './pages/Enrollment';
import Sessions from './pages/Sessions';
import Analytics from './pages/Analytics';

export default function App() {
  const [activeTab, setActiveTab] = useState('live');

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        {activeTab === 'live' && (
          <LiveAttendance onNavigateToSessions={() => setActiveTab('sessions')} />
        )}
        {activeTab === 'enrollment' && <Enrollment />}
        {activeTab === 'sessions' && (
          <Sessions onNavigateToLive={() => setActiveTab('live')} />
        )}
        {activeTab === 'analytics' && <Analytics />}
      </main>
    </div>
  );
}
