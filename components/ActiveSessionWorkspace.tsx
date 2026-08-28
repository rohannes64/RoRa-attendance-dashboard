'use client';

import React, { useState, useEffect } from 'react';
import {
  Camera,
  FileSpreadsheet,
  Square,
  Clock,
  MapPin,
  Users,
  Radio,
  ChevronLeft,
  Download,
} from 'lucide-react';
import { ClassSession } from '../data/sessionsData';
import { WebcamScanner } from './WebcamScanner';
import { LiveSessionLog } from './LiveSessionLog';
import type { StudentProfile, AttendanceRecord } from '../types/attendance';

interface ActiveSessionWorkspaceProps {
  session: ClassSession;
  onEndSession: () => void;
  enrolledStudents: StudentProfile[];
  attendanceRecords: AttendanceRecord[];
  onMarkAttendance: (
    student: StudentProfile,
    confidence: number,
    distance: number,
    livenessScore: number,
    snapshotUrl?: string
  ) => void;
  onUpdateStatus: (studentId: string, status: 'PRESENT' | 'LATE' | 'ABSENT') => void;
  onDeleteRecord: (recordId: string) => void;
  isCameraActive: boolean;
  setIsCameraActive: (a: boolean) => void;
}

export const ActiveSessionWorkspace: React.FC<ActiveSessionWorkspaceProps> = ({
  session,
  onEndSession,
  enrolledStudents,
  attendanceRecords,
  onMarkAttendance,
  onUpdateStatus,
  onDeleteRecord,
  isCameraActive,
  setIsCameraActive,
}) => {
  const [sessionCategory, setSessionCategory] = useState<'SCANNER' | 'ATTENDANCE'>('SCANNER');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Filter students enrolled specifically in this class session
  const matchingStudents = enrolledStudents.filter((s) => {
    if (session.enrolledStudentIds && session.enrolledStudentIds.includes(s.id)) return true;
    if (s.id.startsWith('std-custom-')) return true;
    return false;
  });

  const sessionStudents = matchingStudents.length > 0 ? matchingStudents : enrolledStudents;

  // Filter attendance records specifically for this course session
  const sessionAttendance = attendanceRecords.filter(
    (r) => r.courseCode === session.courseCode || r.sessionId === `sess-${session.section}`
  );

  // Live Elapsed Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const presentCount = sessionAttendance.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const absentCount = sessionStudents.length - presentCount;

  return (
    <div className="flex flex-col h-full bg-[#060a14] overflow-hidden">
      {/* Top Session Control Banner */}
      <div className="h-12 shrink-0 border-b border-[#121c2e] bg-[#03060d] px-6 flex items-center justify-between gap-4 select-none">
        {/* Left: Class Info & Back to Sessions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onEndSession}
            title="Return to Classes list"
            className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-[#091120] border border-[#162338] transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Classes</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-white">
              {session.courseCode}: {session.courseName}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              ({session.section})
            </span>
          </div>
        </div>

        {/* Center: Internal Session Categories (Live Scanner vs Attendance Register) */}
        <div className="flex items-center rounded-lg bg-[#070d18] p-0.5 border border-[#142035] text-xs font-mono">
          <button
            onClick={() => setSessionCategory('SCANNER')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
              sessionCategory === 'SCANNER'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Live Scanner</span>
          </button>

          <button
            onClick={() => setSessionCategory('ATTENDANCE')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
              sessionCategory === 'ATTENDANCE'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Attendance Register ({presentCount}/{sessionStudents.length})</span>
          </button>
        </div>

        {/* Right: Live Session Elapsed Timer & End Session Action */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#08101e] border border-[#162338] text-slate-300 tabular-nums">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Elapsed: <strong className="text-white">{formatTimer(elapsedSeconds)}</strong></span>
          </div>

          <button
            onClick={onEndSession}
            className="flex items-center gap-1.5 rounded bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 px-2.5 py-1 text-xs font-medium transition-colors"
          >
            <Square className="h-3 w-3 fill-current" />
            <span>End Session</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto">
        {sessionCategory === 'SCANNER' ? (
          <WebcamScanner
            enrolledStudents={sessionStudents}
            onMarkAttendance={onMarkAttendance}
            recentAttendance={sessionAttendance}
            activeCourse={`${session.courseCode}: ${session.courseName}`}
            setActiveCourse={() => {}}
            activeSection={session.section}
            setActiveSection={() => {}}
            isCameraActive={isCameraActive}
            setIsCameraActive={setIsCameraActive}
          />
        ) : (
          <div className="p-6">
            <LiveSessionLog
              enrolledStudents={sessionStudents}
              attendanceRecords={sessionAttendance}
              activeCourse={`${session.courseCode}: ${session.courseName}`}
              activeSection={session.section}
              onUpdateStatus={onUpdateStatus}
              onDeleteRecord={onDeleteRecord}
            />
          </div>
        )}
      </div>
    </div>
  );
};
