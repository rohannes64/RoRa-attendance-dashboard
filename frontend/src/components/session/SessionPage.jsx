import React, { useState } from "react";
import LiveScanner from "./LiveScanner";
import EnrollWizard from "../enroll/EnrollWizard";
import QuickStatusToggle from "./QuickStatusToggle";
import StatusBadge from "../common/StatusBadge";

export default function SessionPage({
  session,
  onBack,
  students = [],
  attendanceRecords = [],
  log = [],
  totalIn = 0,
  totalOut = 0,
  onLog,
  onEnroll,
  onOpenAdminConsole,
  onStartSession,
  onEndSession,
  onMarkStudentStatus,
  onDeleteAttendanceRecord,
}) {
  const [activeTab, setActiveTab] = useState("detect");
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  // Filter students enrolled in THIS specific session
  const sessionStudents = session.enrolledStudentIds && session.enrolledStudentIds.length > 0
    ? students.filter((s) => session.enrolledStudentIds?.includes(s.id) || session.enrolledStudentIds?.includes(s.studentId))
    : students;

  // Filter attendance records for THIS specific session
  const sessionRecords = attendanceRecords.filter((r) => r.sessionId === (session.id || session.sessionId));

  // Telemetry math
  const presentCount = sessionStudents.filter((st) => {
    const rec = sessionRecords.find((r) => r.studentId === st.id || r.studentId === st.studentId);
    const logMatch = log.find((l) => l.student?.id === st.id);
    const status = rec?.status || (logMatch ? "present" : null);
    return status === "present";
  }).length;

  const lateCount = sessionStudents.filter((st) => {
    const rec = sessionRecords.find((r) => r.studentId === st.id || r.studentId === st.studentId);
    return rec?.status === "late";
  }).length;

  const absentCount = Math.max(0, sessionStudents.length - presentCount - lateCount);

  const isSessionActive = session.status === "active";
  const isSessionCompleted = session.status === "completed";

  return (
    <div className="min-h-full bg-[#140E07] text-[#F0E2C8]">
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

          <div className="flex items-center gap-3">
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
                { id: "detect", label: "Live Detection" },
                { id: "list", label: "Attendance" },
                { id: "enroll", label: "Enroll" },
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

        {/* Tab Content */}
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
                    This session ended at <span className="text-[#E8943A] font-mono">{session.endedAt || "earlier"}</span>. Camera scanner is locked for completed sessions.
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
                {!isSessionCompleted && onMarkStudentStatus && (
                  <button
                    onClick={() => setStatusModalOpen(true)}
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
                      const logMatch = log.find((l) => l.student?.id === st.id);
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
                            {onMarkStudentStatus && !isSessionCompleted ? (
                              <select
                                value={status}
                                onChange={(e) =>
                                  onMarkStudentStatus(
                                    session.id || session.sessionId,
                                    st.id,
                                    e.target.value
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
                              <StatusBadge status={status} />
                            )}
                          </td>
                          <td className="px-5 py-4 text-[#A89070] font-mono text-xs">
                            {recMatch?.checkIn || (logMatch ? new Date(logMatch.time).toLocaleTimeString("en-GB") : "—")}
                          </td>
                          <td className="px-5 py-4">
                            {onDeleteAttendanceRecord && recMatch && (
                              <button
                                onClick={() => onDeleteAttendanceRecord(recMatch.id || recMatch.recordId)}
                                className="px-2 py-1 rounded border border-rose-900/50 bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 text-xs font-medium"
                              >
                                Clear Log
                              </button>
                            )}
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
                  Extract 128D FaceNet biometric embeddings and portraits to enroll new student profiles into recognition.
                </p>
              </div>
              <div className="rounded-2xl border border-[#2A1F13] bg-[#1E1610] p-6 shadow-xl">
                <EnrollWizard onEnroll={onEnroll} enrolled={students} />
              </div>
            </div>
          )}
        </div>
      </div>

      {statusModalOpen && (
        <QuickStatusToggle
          session={session}
          sessionStudents={sessionStudents}
          sessionRecords={sessionRecords}
          onMarkStudentStatus={onMarkStudentStatus}
          onClose={() => setStatusModalOpen(false)}
        />
      )}
    </div>
  );
}
