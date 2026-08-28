'use client';

import React, { useState, useEffect } from "react";
import type { Student, AttendanceRecord } from "../../data/figmaData";

export interface Session {
  id: string;
  subject: string;
  code: string;
  instructor: string;
  time: string;
  room: string;
  enrolled: number;
  present: number;
  color: string;
  status?: "upcoming" | "active" | "completed";
  enrolledStudentIds?: string[];
  startedAt?: string;
  endedAt?: string;
}

export const SESSIONS: Session[] = [
  {
    id: "cs301",
    subject: "Machine Learning",
    code: "CS 301",
    instructor: "Dr. Amara Osei",
    time: "08:00 – 09:30",
    room: "Lab 4B",
    enrolled: 6,
    present: 4,
    color: "#C4622D",
    status: "active",
    enrolledStudentIds: ["1", "2", "3", "4", "5", "6"],
    startedAt: "08:00 AM",
  },
  {
    id: "ds201",
    subject: "Data Structures",
    code: "DS 201",
    instructor: "Prof. Lena Hartmann",
    time: "10:00 – 11:30",
    room: "Hall A",
    enrolled: 6,
    present: 5,
    color: "#E8943A",
    status: "upcoming",
    enrolledStudentIds: ["2", "4", "6", "8", "10", "12"],
  },
  {
    id: "cv401",
    subject: "Computer Vision",
    code: "CV 401",
    instructor: "Dr. Kenji Mori",
    time: "13:00 – 14:30",
    room: "Lab 2C",
    enrolled: 5,
    present: 4,
    color: "#A0522D",
    status: "upcoming",
    enrolledStudentIds: ["1", "3", "5", "7", "9"],
  },
  {
    id: "ai502",
    subject: "AI Ethics",
    code: "AI 502",
    instructor: "Dr. Sofia Navarro",
    time: "15:00 – 16:30",
    room: "Room 310",
    enrolled: 5,
    present: 3,
    color: "#CD7F32",
    status: "upcoming",
    enrolledStudentIds: ["2", "3", "7", "11", "12"],
  },
  {
    id: "db302",
    subject: "Database Systems",
    code: "DB 302",
    instructor: "Prof. Malik James",
    time: "09:00 – 10:30",
    room: "Hall B",
    enrolled: 6,
    present: 5,
    color: "#B8601A",
    status: "completed",
    enrolledStudentIds: ["1", "4", "5", "8", "9", "11"],
    startedAt: "09:00 AM",
    endedAt: "10:30 AM",
  },
];

interface Props {
  sessions?: Session[];
  students?: Student[];
  attendanceRecords?: AttendanceRecord[];
  onSelectSession: (session: Session) => void;
  totalEnrolledCount?: number;
  onOpenAdminConsole?: () => void;
  onCreateSession?: () => void;
  onEditSession?: (session: Session) => void;
  onDeleteSession?: (id: string) => void;
  onStartSession?: (session: Session) => void;
  onEndSession?: (session: Session) => void;
}

export default function HomePage({
  sessions = SESSIONS,
  students = [],
  attendanceRecords = [],
  onSelectSession,
  totalEnrolledCount = 160,
  onOpenAdminConsole,
  onCreateSession,
  onEditSession,
  onDeleteSession,
  onStartSession,
  onEndSession,
}: Props) {
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [activeTab, setActiveTab] = useState<"live" | "completed">("live");
  const [selectedCompletedSession, setSelectedCompletedSession] = useState<Session | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
      setDateStr(now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const liveSessions = sessions.filter((s) => s.status !== "completed");
  const completedSessions = sessions.filter((s) => s.status === "completed");

  return (
    <div className="min-h-full bg-[#140E07] text-[#F0E2C8]">
      {/* Sticky Header */}
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

      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Hero Section */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#C4622D]/40 bg-[#C4622D]/10 text-[#C4622D] text-xs tracking-widest uppercase font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C4622D] animate-pulse" />
            Biometric Attendance System
          </div>
          <h1 className="font-serif text-5xl lg:text-6xl leading-tight mb-4 max-w-2xl text-[#F0E2C8]">
            Attendance,<br />
            <em className="text-[#C4622D] not-italic">recognized</em> instantly.
          </h1>
          <p className="text-[#A89070] text-lg max-w-lg leading-relaxed">
            Start a session below to launch real-time face detection, or review completed session archives.
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            { label: "Active & Upcoming", value: liveSessions.length.toString(), sub: "Scheduled Today" },
            { label: "Completed Sessions", value: completedSessions.length.toString(), sub: "Archived with reports" },
            { label: "Total Students Enrolled", value: totalEnrolledCount.toString(), sub: "Across all sessions" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[#2A1F13] bg-[#1E1610] px-6 py-5">
              <div className="font-serif text-4xl text-[#E8943A] mb-1">{s.value}</div>
              <div className="text-sm font-medium text-[#F0E2C8]">{s.label}</div>
              <div className="text-xs text-[#A89070] mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Sessions Filter Tab Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-[#1E1610] rounded-xl p-1 border border-[#2A1F13]">
            <button
              onClick={() => setActiveTab("live")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "live"
                  ? "bg-[#C4622D] text-[#F0E2C8] shadow-sm"
                  : "text-[#A89070] hover:text-[#F0E2C8]"
              }`}
            >
              Today's Live Sessions ({liveSessions.length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "completed"
                  ? "bg-[#C4622D] text-[#F0E2C8] shadow-sm"
                  : "text-[#A89070] hover:text-[#F0E2C8]"
              }`}
            >
              Completed Sessions Archive ({completedSessions.length})
            </button>
          </div>

          {onCreateSession && (
            <button
              onClick={onCreateSession}
              className="px-4 py-2 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold transition-all shadow-md"
            >
              + Create Session
            </button>
          )}
        </div>

        {/* TAB 1: LIVE & UPCOMING SESSIONS */}
        {activeTab === "live" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in-up">
            {liveSessions.length === 0 ? (
              <div className="col-span-full py-12 text-center border border-dashed border-[#2A1F13] rounded-2xl">
                <p className="text-[#A89070]">No active or upcoming sessions scheduled.</p>
              </div>
            ) : (
              liveSessions.map((session, i) => {
                const isSessionActive = session.status === "active";
                const enrolledCount = session.enrolledStudentIds?.length || session.enrolled;
                const pct = Math.round((session.present / (enrolledCount || 1)) * 100);

                return (
                  <div
                    key={session.id}
                    className="card-hover text-left rounded-2xl border border-[#2A1F13] bg-[#1E1610] overflow-hidden group transition-all relative flex flex-col justify-between"
                  >
                    {/* Accent line */}
                    <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${session.color}, transparent)` }} />
                    
                    <div className="p-6 cursor-pointer" onClick={() => onSelectSession(session)}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono tracking-widest text-[#A89070] uppercase">{session.code}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isSessionActive
                                  ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 animate-pulse"
                                  : "bg-amber-950/60 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {isSessionActive ? "● LIVE ACTIVE" : "UPCOMING"}
                            </span>
                          </div>
                          <h3 className="font-serif text-xl text-[#F0E2C8] group-hover:text-[#E8943A] transition-colors">
                            {session.subject}
                          </h3>
                        </div>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center border border-[#2A1F13] text-[#A89070] group-hover:border-[#C4622D] group-hover:text-[#C4622D] transition-all shrink-0">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>

                      <div className="space-y-1.5 mb-5">
                        <div className="flex items-center gap-2 text-sm text-[#A89070]">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
                            <path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                          </svg>
                          {session.time}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#A89070]">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <rect x="1.5" y="2" width="9" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                            <path d="M4 1v2M8 1v2M1.5 5h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                          </svg>
                          {session.room}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#A89070]">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <circle cx="6" cy="4" r="2" stroke="currentColor" strokeWidth="1.2"/>
                            <path d="M2 11c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                          </svg>
                          {session.instructor}
                        </div>
                      </div>

                      {/* Attendance Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-[#A89070]">{session.present} present</span>
                          <span style={{ color: session.color }}>{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#2A1F13] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${session.color}, #E8943A)` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs mt-1 text-[#5A4533]">
                          <span>{enrolledCount} assigned students</span>
                          <span>{enrolledCount - session.present} absent</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Action Footer */}
                    <div className="px-6 py-3 bg-[#140E07]/60 border-t border-[#2A1F13] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {!isSessionActive ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onStartSession) onStartSession(session);
                              else onSelectSession(session);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-900 transition-all font-semibold"
                          >
                            ▶ Start Session
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onEndSession) onEndSession(session);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs bg-rose-950/80 border border-rose-500/40 text-rose-400 hover:bg-rose-900 transition-all font-semibold"
                          >
                            ⏹ End Session
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {onEditSession && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditSession(session);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs border border-[#2A1F13] text-[#A89070] hover:text-[#E8943A] transition-all font-medium"
                          >
                            Edit
                          </button>
                        )}
                        {onDeleteSession && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(session.id);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs border border-rose-900/40 text-rose-400 hover:bg-rose-950/60 transition-all font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: COMPLETED SESSIONS ARCHIVE */}
        {activeTab === "completed" && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {completedSessions.length === 0 ? (
                <div className="col-span-full py-16 text-center border border-dashed border-[#2A1F13] rounded-2xl">
                  <div className="text-3xl mb-2 opacity-30">✓</div>
                  <h3 className="font-serif text-lg text-[#F0E2C8] mb-1">No Completed Sessions Yet</h3>
                  <p className="text-[#A89070] text-xs">Start and end a session to view its archived attendance report here.</p>
                </div>
              ) : (
                completedSessions.map((session) => {
                  const enrolledCount = session.enrolledStudentIds?.length || session.enrolled;
                  const pct = Math.round((session.present / (enrolledCount || 1)) * 100);

                  return (
                    <div
                      key={session.id}
                      className="rounded-2xl border border-[#2A1F13] bg-[#1E1610] overflow-hidden flex flex-col justify-between"
                    >
                      <div className="h-1.5 bg-[#4A3828]" />
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <span className="text-xs font-mono tracking-widest text-[#A89070] uppercase">{session.code}</span>
                            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#140E07] text-[#A89070] border border-[#2A1F13]">
                              COMPLETED
                            </span>
                            <h3 className="font-serif text-xl text-[#F0E2C8] mt-1">{session.subject}</h3>
                          </div>
                        </div>

                        <div className="space-y-1 text-xs text-[#A89070] mb-4 font-mono">
                          <div>Time: {session.time}</div>
                          <div>Room: {session.room}</div>
                          <div>Instructor: {session.instructor}</div>
                          {session.endedAt && <div className="text-emerald-400">Ended at: {session.endedAt}</div>}
                        </div>

                        <div className="rounded-xl bg-[#140E07] p-3 border border-[#2A1F13] flex items-center justify-between mb-4">
                          <div>
                            <div className="text-[11px] text-[#A89070] uppercase">Attendance</div>
                            <div className="font-serif text-lg text-[#E8943A]">{session.present} / {enrolledCount}</div>
                          </div>
                          <div className="font-serif text-2xl text-emerald-400 font-bold">{pct}%</div>
                        </div>

                        <button
                          onClick={() => setSelectedCompletedSession(session)}
                          className="w-full py-2 rounded-xl bg-[#140E07] border border-[#2A1F13] text-[#F0E2C8] hover:border-[#C4622D] hover:text-[#E8943A] text-xs font-semibold transition-all"
                        >
                          View Full Attendance Report →
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* COMPLETED SESSION REPORT MODAL */}
      {selectedCompletedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-[#1E1610] border border-[#2A1F13] rounded-2xl p-6 shadow-2xl animate-fade-in-up max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#2A1F13] shrink-0">
              <div>
                <span className="text-xs font-mono text-[#C4622D] font-bold uppercase">{selectedCompletedSession.code}</span>
                <h3 className="font-serif text-2xl text-[#F0E2C8]">{selectedCompletedSession.subject} — Archived Report</h3>
                <p className="text-xs text-[#A89070]">Instructor: {selectedCompletedSession.instructor} • Room: {selectedCompletedSession.room}</p>
              </div>
              <button
                onClick={() => setSelectedCompletedSession(null)}
                className="w-8 h-8 rounded-full bg-[#140E07] text-[#A89070] hover:text-[#F0E2C8] flex items-center justify-center text-sm border border-[#2A1F13]"
              >
                ✕
              </button>
            </div>

            <div className="py-4 shrink-0 grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[#140E07] border border-[#2A1F13]">
                <div className="text-[10px] uppercase text-[#A89070]">Assigned Students</div>
                <div className="font-serif text-xl text-[#F0E2C8]">
                  {selectedCompletedSession.enrolledStudentIds?.length || selectedCompletedSession.enrolled}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#140E07] border border-[#2A1F13]">
                <div className="text-[10px] uppercase text-[#A89070]">Present</div>
                <div className="font-serif text-xl text-emerald-400">{selectedCompletedSession.present}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#140E07] border border-[#2A1F13]">
                <div className="text-[10px] uppercase text-[#A89070]">Absent</div>
                <div className="font-serif text-xl text-rose-400">
                  {(selectedCompletedSession.enrolledStudentIds?.length || selectedCompletedSession.enrolled) - selectedCompletedSession.present}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <h4 className="text-xs font-mono text-[#A89070] uppercase mb-2">Student Attendance List</h4>
              <div className="rounded-xl border border-[#2A1F13] overflow-hidden bg-[#140E07]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#2A1F13] bg-[#18110B] text-[#A89070]">
                      <th className="text-left px-4 py-2.5">Student Name</th>
                      <th className="text-left px-4 py-2.5">Roll ID</th>
                      <th className="text-left px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedCompletedSession.enrolledStudentIds || ["1", "2", "3", "4", "5"]).map((stId, idx) => {
                      const st = students.find((s) => s.id === stId || s.studentId === stId) || { name: `Student ${stId}`, studentId: stId };
                      const isPresent = idx < selectedCompletedSession.present;
                      return (
                        <tr key={stId} className="border-b border-[#2A1F13] last:border-0">
                          <td className="px-4 py-2.5 text-[#F0E2C8] font-medium">{st.name}</td>
                          <td className="px-4 py-2.5 text-[#A89070] font-mono">{st.studentId || stId}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isPresent ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30" : "bg-rose-950 text-rose-400 border border-rose-500/30"}`}>
                              {isPresent ? "PRESENT" : "ABSENT"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 border-t border-[#2A1F13] shrink-0 text-right">
              <button
                onClick={() => setSelectedCompletedSession(null)}
                className="px-5 py-2 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
