import React, { useState } from 'react';
import Header from '../common/Header';
import CompletedReportModal from './CompletedReportModal';

export default function HomePage({
  sessions = [],
  students = [],
  onSelectSession,
  totalEnrolledCount = 160,
  onOpenAdminConsole,
  onCreateSession,
  onEditSession,
  onDeleteSession,
  onStartSession,
  onEndSession,
}) {
  const [activeTab, setActiveTab] = useState('live');
  const [selectedCompletedSession, setSelectedCompletedSession] = useState(null);

  const liveSessions = sessions.filter((s) => s.status !== 'completed');
  const completedSessions = sessions.filter((s) => s.status === 'completed');

  return (
    <div className="min-h-full bg-[#140E07] text-[#F0E2C8]">
      <Header onOpenAdminConsole={onOpenAdminConsole} />

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
            Select a class session below to begin real-time face detection and automated attendance tracking.
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

        {/* Filter Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-[#1E1610] rounded-xl p-1 border border-[#2A1F13]">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'live'
                  ? 'bg-[#C4622D] text-[#F0E2C8] shadow-sm'
                  : 'text-[#A89070] hover:text-[#F0E2C8]'
              }`}
            >
              Today's Live Sessions ({liveSessions.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'completed'
                  ? 'bg-[#C4622D] text-[#F0E2C8] shadow-sm'
                  : 'text-[#A89070] hover:text-[#F0E2C8]'
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

        {/* Live Sessions Grid */}
        {activeTab === 'live' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in-up">
            {liveSessions.length === 0 ? (
              <div className="col-span-full py-12 text-center border border-dashed border-[#2A1F13] rounded-2xl">
                <p className="text-[#A89070]">No active or upcoming sessions scheduled.</p>
              </div>
            ) : (
              liveSessions.map((session, i) => {
                const isSessionActive = session.status === 'active';
                const enrolledCount = session.enrolledStudentIds?.length || session.enrolled || 6;
                const pct = Math.round((session.present / (enrolledCount || 1)) * 100);

                return (
                  <div
                    key={session.id || session.sessionId}
                    className="card-hover text-left rounded-2xl border border-[#2A1F13] bg-[#1E1610] overflow-hidden group transition-all relative flex flex-col justify-between"
                  >
                    <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${session.color || '#C4622D'}, transparent)` }} />
                    
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
                              onDeleteSession(session.id || session.sessionId);
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

        {/* Completed Sessions Archive */}
        {activeTab === 'completed' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in-up">
            {completedSessions.length === 0 ? (
              <div className="col-span-full py-16 text-center border border-dashed border-[#2A1F13] rounded-2xl">
                <div className="text-3xl mb-2 opacity-30">✓</div>
                <h3 className="font-serif text-lg text-[#F0E2C8] mb-1">No Completed Sessions Yet</h3>
                <p className="text-[#A89070] text-xs">Start and end a session to view its archived attendance report here.</p>
              </div>
            ) : (
              completedSessions.map((session) => {
                const enrolledCount = session.enrolledStudentIds?.length || session.enrolled || 6;
                const pct = Math.round((session.present / (enrolledCount || 1)) * 100);

                return (
                  <div
                    key={session.id || session.sessionId}
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
        )}
      </main>

      {selectedCompletedSession && (
        <CompletedReportModal
          session={selectedCompletedSession}
          students={students}
          onClose={() => setSelectedCompletedSession(null)}
        />
      )}
    </div>
  );
}
