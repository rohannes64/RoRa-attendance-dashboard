'use client';

import React, { useState, useEffect } from 'react';
import {
  Camera,
  Users,
  FileSpreadsheet,
  Cpu,
  Volume2,
  VolumeX,
  Presentation,
  UserPlus,
  Radio,
} from 'lucide-react';
import { isSoundEnabled, setSoundEnabled } from '../lib/audio';

export type ActiveTab = 'SCANNER' | 'DIRECTORY' | 'LOGS' | 'BENCHMARK' | 'PITCH';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenEnrollment: () => void;
  modelsLoaded: boolean;
  modelLoadingStatus: string;
  enrolledCount: number;
  presentCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenEnrollment,
  modelsLoaded,
  modelLoadingStatus,
  enrolledCount,
  presentCount,
}) => {
  const [soundOn, setSoundOn] = useState(true);
  const [istTime, setIstTime] = useState<string>('');

  useEffect(() => {
    setSoundOn(isSoundEnabled());
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      setIstTime(`${timeString} IST`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: 'SCANNER', label: 'Live Scanner', icon: Camera },
    { id: 'DIRECTORY', label: 'Student Directory', icon: Users, count: enrolledCount },
    { id: 'LOGS', label: 'Session Ledger', icon: FileSpreadsheet, count: presentCount },
    { id: 'BENCHMARK', label: 'Benchmark Sandbox', icon: Cpu },
    { id: 'PITCH', label: 'Architecture & Slides', icon: Presentation },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[#182338] bg-[#080c14]/95 backdrop-blur-md transition-all">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#10192a] border border-[#233556] text-emerald-400 font-bold text-sm shadow-sm font-mono">
              दृ
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white font-sans">
                  Drishti <span className="font-light text-slate-400">CV</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.2 text-[10px] font-mono font-medium text-emerald-300">
                  <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-400" />
                  Live Edge
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono tracking-wide">
                Institutional Attendance System
              </span>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="hidden lg:flex items-center gap-1 rounded-lg bg-[#0e1422] p-1 border border-[#1b273e]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#182338] text-white shadow-sm border border-[#293c5e]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121929] border border-transparent'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {typeof item.count === 'number' && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono tabular-nums ${
                        isActive
                          ? 'bg-[#0a0f1c] text-emerald-300 font-semibold'
                          : 'bg-[#121827] text-slate-500'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            {/* IST Clock */}
            <div className="hidden sm:flex items-center rounded-md bg-[#0e1422] px-2.5 py-1 border border-[#1b273e] text-[11px] font-mono text-slate-400 tabular-nums">
              {istTime || '09:00:00 IST'}
            </div>

            {/* Audio Toggle */}
            <button
              onClick={handleToggleSound}
              title={soundOn ? 'Audio chime active' : 'Audio muted'}
              className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0e1422] border border-[#1b273e] text-slate-400 hover:text-slate-200 hover:border-[#2b3e64] transition-colors"
            >
              {soundOn ? <Volume2 className="h-3.5 w-3.5 text-emerald-400" /> : <VolumeX className="h-3.5 w-3.5 text-slate-500" />}
            </button>

            {/* Enroll Student CTA */}
            <button onClick={onOpenEnrollment} className="btn-primary">
              <UserPlus className="h-3.5 w-3.5" />
              <span>Enroll Student</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1 border-t border-[#162033] no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#182338] text-white border border-[#283754]'
                    : 'text-slate-400 hover:bg-[#131b2c]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
