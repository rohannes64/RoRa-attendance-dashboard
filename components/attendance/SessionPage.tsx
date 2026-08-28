'use client';

import React, { useState } from "react";
import type { Student, AttendanceRecord } from "../../data/figmaData";
import LiveScanner, { type LogEntry } from "../figma/LiveScanner";
import EnrollPage from "../figma/EnrollPage";
import type { Session } from "./HomePage";

interface Props {
  session: Session;
  onBack: () => void;
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  log: LogEntry[];
  totalIn: number;
  totalOut: number;
  onLog: (entry: LogEntry) => void;
  onEnroll: (student: Student) => void;
  onOpenAdminConsole?: () => void;
  onStartSession?: (s: Session) => void;
  onEndSession?: (s: Session) => void;
  onMarkStudentAttendance?: (sessionId: string, studentId: string, status: "present" | "late" | "absent") => void;
  onDeleteAttendanceRecord?: (id: string) => void;
  onUpdateStudent?: (st: Student) => void;
  onDeleteStudent?: (id: string) => void;
}

export default function SessionPage({
  session,
  onBack,
  students,
  attendanceRecords,
  log,
  totalIn,
  totalOut,
  onLog,
  onEnroll,
  onOpenAdminConsole,
  onStartSession,
  onEndSession,
  onMarkStudentAttendance,
  onDeleteAttendanceRecord,
  onUpdateStudent,
  onDeleteStudent,
}: Props) {
  const [activeTab, setActiveTab] = useState<"detect" | "list" | "enroll">("detect");
  const [manualModalOpen, setManualModalOpen] = useState(false);

  // Filter students enrolled in THIS specific session
  const sessionStudents = session.enrolledStudentIds && session.enrolledStudentIds.length > 0
    ? students.filter((s) => session.enrolledStudentIds?.includes(s.id) || session.enrolledStudentIds?.includes(s.studentId))
    : students;

  // Filter attendance records for THIS specific session
  const sessionRecords = attendanceRecords.filter((r) => r.sessionId === session.id);

  // Calculate telemetry counts for THIS session
  const presentCount = sessionStudents.filter((st) => {
    const rec = sessionRecords.find((r) => r.studentId === st.id);
    const logMatch = log.find((l) => l.student.id === st.id);
    const status = rec?.status || (logMatch ? "present" : null);
    return status === "present";
  }).length;

  const lateCount = sessionStudents.filter((st) => {
    const rec = sessionRecords.find((r) => r.studentId === st.id);
    return rec?.status === "late";
  }).length;

  const absentCount = Math.max(0, sessionStudents.length - presentCount - lateCount);

  const isSessionActive = session.status === "active";
  const isSessionCompleted = session.status === "completed";

  return (
    <div className="min-h-full bg-[#140E07] text-[#F0E2C8]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#140E07]/90 backdrop-blur border-b border-[#2A1F13]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-[#A89070] hover:text-[#E8943A] transition-colors text-sm font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sessions
            </button>
            <div className="w-px h-5 bg-[#2A1F13]" />
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono tracking-widest text-[#C4622D] uppercase font-semibold">{session.code}</span>
              <h1 className="font-serif text-lg text-[#F0E2C8]">{session.subject}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isSessionActive
                    ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 animate-pulse"
                    : isSessionCompleted
                    ? "bg-[#1E1610] text-[#A89070] border border-[#2A1F13]"
                    : "bg-amber-950/60 text-amber-400 border border-amber-500/30"
                }`}
              >
                {isSessionActive ? "● LIVE ACTIVE" : isSessionCompleted ? "COMPLETED" : "UPCOMING"}
              </span>
            </div>
          </div>

          {/* Top Bar Actions */}
          <div className="flex items-center gap-3">
            {/* Start / End Session Controls */}
            {!isSessionCompleted && (
              <div>
                {!isSessionActive ? (
                  <button
                    onClick={() => onStartSession && onStartSession(session)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-900 text-xs font-semibold transition-all shadow-sm"
                  >
                    ▶ Start Session
                  </button>
                ) : (
                  <button
                    onClick={() => onEndSession && onEndSession(session)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-400 hover:bg-rose-900 text-xs font-semibold transition-all shadow-sm"
                  >
                    ⏹ End Session
                  </button>
                )}
              </div>
            )}

            {onOpenAdminConsole && (
              <button
                onClick={onOpenAdminConsole}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E1610] border border-[#2A1F13] text-[#E8943A] hover:bg-[#C4622D] hover:text-[#F0E2C8] text-xs font-semibold transition-all shadow-sm"
              >
                ⚙ Admin Console
              </button>
            )}

            <div className="flex gap-1 bg-[#1E1610] rounded-xl p-1 border border-[#2A1F13]">
              {[
                { id: "detect" as const, label: "Live Detection" },
                { id: "list" as const, label: "Attendance" },
                { id: "enroll" as const, label: "Enroll" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    activeTab === tab.id
                      ? "bg-[#C4622D] text-[#F0E2C8] shadow-sm"
                      : "text-[#A89070] hover:text-[#F0E2C8]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Present", value: presentCount, color: "text-emerald-400", bg: "bg-emerald-950/20 border-emerald-900/40" },
            { label: "Late", value: lateCount, color: "text-amber-400", bg: "bg-amber-950/20 border-amber-900/40" },
            { label: "Absent", value: absentCount, color: "text-rose-400", bg: "bg-rose-950/20 border-rose-900/40" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-4 border ${s.bg} flex items-center gap-4`}>
              <span className={`font-serif text-3xl ${s.color}`}>{s.value}</span>
              <span className="text-[#A89070] text-sm font-medium">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Tab Views */}
        <div className="animate-fade-in-up">
          {activeTab === "detect" && (
            <div className="rounded-2xl border border-[#2A1F13] bg-[#1E1610] overflow-hidden relative" style={{ height: "640px" }}>
              {isSessionCompleted && (
                <div className="absolute inset-0 z-20 bg-[#140E07]/90 backdrop-blur flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#1E1610] border border-[#2A1F13] flex items-center justify-center text-3xl mb-4 text-[#E8943A]">
                    ✓
                  </div>
                  <h3 className="font-serif text-2xl text-[#F0E2C8] mb-2">Session Completed & Archived</h3>
                  <p className="text-[#A89070] text-sm max-w-md mb-6">
                    This session was ended at <span className="text-[#E8943A] font-mono">{session.endedAt || "earlier"}</span>. Camera scanner is locked for completed sessions.
                  </p>
                  <button
                    onClick={() => setActiveTab("list")}
                    className="px-6 py-2.5 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold shadow-md"
                  >
                    View Attendance Ledger
                  </button>
                </div>
              )}
              <LiveScanner
                students={sessionStudents}
                onLog={onLog}
                log={log}
                totalIn={totalIn}
                totalOut={totalOut}
              />
            </div>
          )}

          {activeTab === "list" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-serif text-xl text-[#F0E2C8]">{session.subject} Attendance Roster</h2>
                  <p className="text-xs text-[#A89070]">{sessionStudents.length} assigned students for this course</p>
                </div>
                {!isSessionCompleted && onMarkStudentAttendance && (
                  <button
                    onClick={() => setManualModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold transition-all shadow-md"
                  >
                    ⚡ Mark / Update Student Status
                  </button>
                )}
              </div>

              <div className="rounded-xl border border-[#2A1F13] overflow-hidden bg-[#1E1610]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#18110B] border-b border-[#2A1F13]">
                      {["Student Name", "Student / Roll ID", "Department", "Attendance Status", "Check-in Time", "Actions"].map((h) => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold tracking-widest uppercase text-[#A89070]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessionStudents.map((st, i) => {
                      const recMatch = sessionRecords.find((r) => r.studentId === st.id || r.studentId === st.studentId);
                      const logMatch = log.find((l) => l.student.id === st.id || l.student.studentId === st.studentId);
                      const status = recMatch?.status || (logMatch ? "present" : "absent");


                      return (
                        <tr
                          key={st.id}
                          className={`border-b border-[#2A1F13] last:border-0 hover:bg-[#251C15] transition-colors ${
                            i % 2 === 0 ? "bg-[#1E1610]" : "bg-[#18110B]"
                          }`}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#C4622D]/20 border border-[#C4622D]/40 text-[#E8943A] flex items-center justify-center text-xs font-semibold">
                                {st.avatar || st.name.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="font-medium text-[#F0E2C8]">{st.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-[#A89070] font-mono text-xs">{st.studentId || st.id}</td>
                          <td className="px-5 py-4 text-[#A89070] text-xs">{st.department || "Computer Science"}</td>
                          <td className="px-5 py-4">
                            {onMarkStudentAttendance && !isSessionCompleted ? (
                              <select
                                value={status}
                                onChange={(e) =>
                                  onMarkStudentAttendance(
                                    session.id,
                                    st.id,
                                    e.target.value as "present" | "late" | "absent"
                                  )
                                }
                                className="bg-[#140E07] border border-[#2A1F13] rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-[#E8943A]"
                                style={{
                                  color: status === "present" ? "#34d399" : status === "late" ? "#fbbf24" : "#fb7185",
                                }}
                              >
                                <option value="present" className="text-emerald-400 bg-[#140E07]">PRESENT</option>
                                <option value="late" className="text-amber-400 bg-[#140E07]">LATE</option>
                                <option value="absent" className="text-rose-400 bg-[#140E07]">ABSENT</option>
                              </select>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  status === "present"
                                    ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                                    : status === "late"
                                    ? "bg-amber-950/60 text-amber-400 border border-amber-500/30"
                                    : "bg-rose-950/60 text-rose-400 border border-rose-500/30"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    status === "present" ? "bg-emerald-400" : status === "late" ? "bg-amber-400" : "bg-rose-400"
                                  }`}
                                />
                                {status.toUpperCase()}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-[#A89070] font-mono text-xs">
                            {recMatch?.checkIn || (logMatch ? new Date(logMatch.time).toLocaleTimeString("en-GB") : "—")}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              {onDeleteAttendanceRecord && recMatch && (
                                <button
                                  onClick={() => onDeleteAttendanceRecord(recMatch.id)}
                                  className="px-2 py-1 rounded border border-rose-900/50 bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 text-xs font-medium"
                                >
                                  Clear Log
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "enroll" && (
            <div className="max-w-2xl mx-auto py-4">
              <div className="mb-6 text-center">
                <h2 className="font-serif text-2xl mb-1.5 text-[#F0E2C8]">Biometric Student Enrollment</h2>
                <p className="text-[#A89070] text-sm">
                  Extract 128D FaceNet biometric embeddings and portraits to enroll new student profiles into live recognition.
                </p>
              </div>
              <div className="rounded-2xl border border-[#2A1F13] bg-[#1E1610] p-6 shadow-xl">
                <EnrollPage onEnroll={onEnroll} enrolled={students.filter((s) => s.id.startsWith("custom-"))} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QUICK MARK STUDENT ATTENDANCE MODAL */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#1E1610] border border-[#2A1F13] rounded-2xl p-6 shadow-2xl animate-fade-in-up max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#2A1F13] shrink-0">
              <div>
                <h3 className="font-serif text-xl text-[#F0E2C8]">Mark Student Status — {session.code}</h3>
                <p className="text-xs text-[#A89070]">Click Present, Late, or Absent to update any student in this session</p>
              </div>
              <button
                onClick={() => setManualModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#140E07] text-[#A89070] hover:text-[#F0E2C8] flex items-center justify-center text-sm border border-[#2A1F13]"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2.5 pr-1">
              {sessionStudents.map((st) => {
                const recMatch = sessionRecords.find((r) => r.studentId === st.id || r.studentId === st.studentId);
                const currentStatus = recMatch?.status || "absent";

                return (
                  <div
                    key={st.id}
                    className="p-3 rounded-xl bg-[#140E07] border border-[#2A1F13] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#C4622D]/20 border border-[#C4622D]/40 text-[#E8943A] flex items-center justify-center text-xs font-semibold shrink-0">
                        {st.avatar || st.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="font-medium text-sm text-[#F0E2C8] truncate">{st.name}</div>
                        <div className="text-xs text-[#A89070] font-mono">{st.studentId || st.id}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          if (onMarkStudentAttendance) onMarkStudentAttendance(session.id, st.id, "present");
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          currentStatus === "present"
                            ? "bg-emerald-950 border border-emerald-500 text-emerald-400 shadow-sm"
                            : "bg-[#1E1610] text-[#A89070] hover:text-emerald-400 border border-[#2A1F13]"
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => {
                          if (onMarkStudentAttendance) onMarkStudentAttendance(session.id, st.id, "late");
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          currentStatus === "late"
                            ? "bg-amber-950 border border-amber-500 text-amber-400 shadow-sm"
                            : "bg-[#1E1610] text-[#A89070] hover:text-amber-400 border border-[#2A1F13]"
                        }`}
                      >
                        Late
                      </button>
                      <button
                        onClick={() => {
                          if (onMarkStudentAttendance) onMarkStudentAttendance(session.id, st.id, "absent");
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          currentStatus === "absent"
                            ? "bg-rose-950 border border-rose-500 text-rose-400 shadow-sm"
                            : "bg-[#1E1610] text-[#A89070] hover:text-rose-400 border border-[#2A1F13]"
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#2A1F13] shrink-0 text-right">
              <button
                onClick={() => setManualModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
