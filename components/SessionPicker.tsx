'use client';

import React from 'react';
import {
  Play,
  Calendar,
  Clock,
  MapPin,
  Users,
  BookOpen,
} from 'lucide-react';
import { PRESET_CLASS_SESSIONS, ClassSession } from '../data/sessionsData';
import type { StudentProfile } from '../types/attendance';

interface SessionPickerProps {
  onSelectAndStartSession: (session: ClassSession) => void;
  allStudents: StudentProfile[];
}

export const SessionPicker: React.FC<SessionPickerProps> = ({
  onSelectAndStartSession,
  allStudents,
}) => {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#121c2e]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-7 w-7 rounded bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-white font-sans">
              Select Class Session
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Choose a scheduled lecture to initialize edge face recognition and start marking attendance.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-[#070d18] border border-[#142035] px-3 py-1 rounded-md">
          <Calendar className="h-3.5 w-3.5 text-cyan-400" />
          <span>Today&apos;s Timetable</span>
        </div>
      </div>

      {/* Class Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PRESET_CLASS_SESSIONS.map((session) => {
          const matchingStudents = allStudents.filter(
            (s) => session.enrolledStudentIds.includes(s.id) || s.id.startsWith('std-custom-')
          );
          const enrolledList = matchingStudents.length > 0 ? matchingStudents : allStudents;
          const enrolledCount = enrolledList.length;

          return (
            <div
              key={session.id}
              className="product-card p-5 flex flex-col justify-between border border-[#142035] bg-[#070c18] hover:border-cyan-500/40 hover:bg-[#091122] transition-all rounded-xl shadow-md space-y-4"
            >
              <div className="space-y-3">
                {/* Top Row: Course Code + Section & Schedule Time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {session.courseCode}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {session.section}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-cyan-400" />
                    {session.scheduleTime}
                  </span>
                </div>

                {/* Course Title & Clean Single Metadata Subtitle */}
                <div>
                  <h3 className="text-sm font-bold text-white font-sans">
                    {session.courseName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    {session.instructor} · <span className="text-slate-300">{session.room}</span>
                  </p>
                </div>
              </div>

              {/* Bottom Row: Avatar Stack on Left & Start Button on Right */}
              <div className="pt-3 border-t border-[#121c2e] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center -space-x-2 overflow-hidden">
                    {enrolledList.slice(0, 5).map((st) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={st.id}
                        src={st.avatarUrl}
                        alt={st.name}
                        title={`${st.name} (${st.rollNo})`}
                        className="inline-block h-6 w-6 rounded-full ring-2 ring-[#070c18] object-cover"
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {enrolledCount} Enrolled
                  </span>
                </div>

                <button
                  onClick={() => onSelectAndStartSession(session)}
                  className="flex items-center gap-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 px-3 py-1.5 text-xs font-semibold shadow-sm transition-all active:scale-98"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Start Session</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
