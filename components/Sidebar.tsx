'use client';

import React from 'react';
import {
  BookOpen,
  Users,
  UserPlus,
  Radio,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { isSoundEnabled, setSoundEnabled } from '../lib/audio';

export type ActiveNavTab = 'SESSIONS' | 'STUDENTS' | 'ENROLL';

interface SidebarProps {
  activeNavTab: ActiveNavTab;
  setActiveNavTab: (tab: ActiveNavTab) => void;
  onOpenEnrollment: () => void;
  enrolledCount: number;
  activeSessionName?: string;
  modelsLoaded: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNavTab,
  setActiveNavTab,
  onOpenEnrollment,
  enrolledCount,
  activeSessionName,
  modelsLoaded,
}) => {
  const [soundOn, setSoundOn] = React.useState(true);

  React.useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  const navItems: { id: ActiveNavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'SESSIONS', label: 'Class Sessions', icon: BookOpen, badge: activeSessionName ? 'LIVE' : undefined },
    { id: 'STUDENTS', label: 'Student Directory', icon: Users },
    { id: 'ENROLL', label: 'Enroll Student', icon: UserPlus },
  ];

  const handleNavClick = (id: ActiveNavTab) => {
    if (id === 'ENROLL') {
      onOpenEnrollment();
    } else {
      setActiveNavTab(id);
    }
  };

  return (
    <aside className="w-60 shrink-0 flex flex-col justify-between border-r border-[#101a2d] bg-[#03060d] p-4 select-none">
      {/* Top Brand & Navigation */}
      <div className="space-y-6">
        {/* Brand Header matching Figma */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500 text-black font-extrabold text-base shadow-sm">
            दृ
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight font-sans">
              Drishti
            </h1>
            <p className="text-[10px] font-mono text-cyan-400/80">Face Recognition</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNavTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#09101d] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Status */}
      <div className="pt-4 border-t border-[#101a2d] space-y-2 text-xs">
        <div className="flex items-center justify-between px-2 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                modelsLoaded ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span>{modelsLoaded ? 'Edge Engine Active' : 'Loading Models...'}</span>
          </div>

          <button
            onClick={handleToggleSound}
            title={soundOn ? 'Sound cues active' : 'Sound muted'}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#0c1424] transition-colors"
          >
            {soundOn ? <Volume2 className="h-3.5 w-3.5 text-cyan-400" /> : <VolumeX className="h-3.5 w-3.5 text-slate-500" />}
          </button>
        </div>

        <div className="px-2 py-1 text-[10px] font-mono text-slate-600 flex justify-between">
          <span>IIT/NIT Portal</span>
          <span>v1.2 Dual-Tone</span>
        </div>
      </div>
    </aside>
  );
};
