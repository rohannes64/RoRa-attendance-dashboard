'use client';

import React from 'react';

interface TopStripProps {
  enrolledCount: number;
  presentCount: number;
  absentCount: number;
  activeCourse: string;
}

export const TopStrip: React.FC<TopStripProps> = ({
  enrolledCount,
  presentCount,
  absentCount,
  activeCourse,
}) => {
  return (
    <header className="h-14 shrink-0 border-b border-[#101a2d] bg-[#03060d] px-6 flex items-center justify-between gap-4 select-none">
      {/* Course Title / Brand */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-300 font-sans">
          {activeCourse}
        </span>
      </div>

      {/* Center 3 Status Badges strictly matching Figma colors */}
      <div className="flex items-center gap-3 font-mono text-xs">
        {/* Cyan Badge: Total Students */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          <span>Total Students: <strong className="text-white tabular-nums">{enrolledCount}</strong></span>
        </div>

        {/* Orange/Amber Badge: Present */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-500/30 text-amber-300 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span>Present: <strong className="text-white tabular-nums">{presentCount}</strong></span>
        </div>

        {/* Purple/Violet Badge: Absent */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/30 text-purple-300 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-purple-400" />
          <span>Absent: <strong className="text-white tabular-nums">{absentCount}</strong></span>
        </div>
      </div>

      {/* Right User Profile matching Figma avatar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
            alt="Instructor profile"
            className="h-8 w-8 rounded-full object-cover border border-cyan-500/40"
          />
        </div>
      </div>
    </header>
  );
};
