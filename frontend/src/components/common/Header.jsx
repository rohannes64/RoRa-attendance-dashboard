import React, { useState, useEffect } from 'react';

export default function Header({ onOpenAdminConsole }) {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setDateStr(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-[#140E07]/90 backdrop-blur border-b border-[#2A1F13]">
      <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#C4622D] flex items-center justify-center shadow-md">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="5" r="2.5" stroke="#F0E2C8" strokeWidth="1.3"/>
              <path d="M3 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="#F0E2C8" strokeWidth="1.3" strokeLinecap="round"/>
              <circle cx="8" cy="8" r="7" stroke="#F0E2C8" strokeWidth="1.3" strokeDasharray="2 2"/>
            </svg>
          </div>
          <span className="font-serif text-xl tracking-tight text-[#F0E2C8]">FaceAttend</span>
        </div>

        <div className="flex items-center gap-6">
          {onOpenAdminConsole && (
            <button
              onClick={onOpenAdminConsole}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#1E1610] border border-[#2A1F13] text-[#E8943A] hover:bg-[#C4622D] hover:text-[#F0E2C8] text-xs font-semibold tracking-wide transition-all shadow-sm"
            >
              <span>⚙ Admin Console</span>
            </button>
          )}
          <div className="text-right">
            <div className="text-sm font-medium text-[#E8943A] font-mono">{timeStr}</div>
            <div className="text-xs text-[#A89070]">{dateStr}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
