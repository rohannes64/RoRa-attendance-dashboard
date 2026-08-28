'use client';

import React, { useState, useEffect } from "react";
import { STUDENTS } from "../data/figmaData";
import type { Student, AttendanceRecord } from "../data/figmaData";
import LiveScanner, { LogEntry } from "../components/figma/LiveScanner";
import AttendancePage from "../components/figma/AttendancePage";
import EnrollPage from "../components/figma/EnrollPage";
import ProductHome from "../components/figma/ProductHome";
import {
  getInitialStudents,
  getInitialAttendance,
  getInitialLogs,
  recordLiveAttendance,
  saveEnrolledStudent,
  saveLiveLogs,
} from "../lib/attendanceStore";

const TEAL = "#26d0ce";
const NAVY = "#0d1b3e";

type Page = "home" | "scanner" | "attendance" | "enroll";

const NAV = [
  {
    key: "home" as Page,
    label: "Overview",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path d="M3 8.5L10 3l7 5.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V8.5z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 18V11h4v7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "scanner" as Page,
    label: "Live Scanner",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <rect x="3" y="3" width="5" height="5" rx="0.5" />
        <rect x="12" y="3" width="5" height="5" rx="0.5" />
        <rect x="3" y="12" width="5" height="5" rx="0.5" />
        <circle cx="14.5" cy="14.5" r="2.5" />
        <path d="M16.5 16.5 L18 18" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "attendance" as Page,
    label: "Attendance",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path d="M4 5h12M4 10h8M4 15h10" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "enroll" as Page,
    label: "Enroll Student",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <circle cx="9" cy="7" r="3" />
        <path d="M3 17c0-3.314 2.686-6 6-6" strokeLinecap="round" />
        <path d="M15 12v6M12 15h6" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [students, setStudents] = useState<Student[]>(STUDENTS);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [totalIn, setTotalIn] = useState(0);
  const [totalOut, setTotalOut] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize from persistent database
  useEffect(() => {
    const loadedStudents = getInitialStudents();
    const loadedAttendance = getInitialAttendance();
    const loadedLogs = getInitialLogs();

    setStudents(loadedStudents);
    setAttendanceRecords(loadedAttendance);
    setLog(loadedLogs);

    const ins = loadedLogs.filter((l) => l.type === "in").length;
    const outs = loadedLogs.filter((l) => l.type === "out").length;
    setTotalIn(ins);
    setTotalOut(outs);
    setIsHydrated(true);
  }, []);

  function handleLog(entry: LogEntry) {
    const updatedLogs = [entry, ...log].slice(0, 50);
    setLog(updatedLogs);
    saveLiveLogs(updatedLogs);

    if (entry.type === "in") setTotalIn((n) => n + 1);
    else setTotalOut((n) => n + 1);

    // Live Database Update: record check-in/check-out for today
    const { updatedRecords } = recordLiveAttendance(
      entry.student,
      entry.time,
      entry.type,
      attendanceRecords
    );
    setAttendanceRecords(updatedRecords);
  }

  function handleEnroll(student: Student) {
    const updated = saveEnrolledStudent(student);
    setStudents(updated);
  }

  const customEnrolled = students.filter((s) => !STUDENTS.some((d) => d.id === s.id));

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{
        background: NAVY,
        fontFamily: "'DM Sans', sans-serif",
        color: "#f0f6ff",
      }}
    >
      {/* Sidebar */}
      <aside
        className="flex flex-col shrink-0 select-none"
        style={{
          width: 220,
          background: "rgba(8,14,34,0.98)",
          borderRight: "1px solid rgba(38,208,206,0.1)",
        }}
      >
        {/* Logo */}
        <div
          onClick={() => setPage("home")}
          className="flex items-center gap-3 px-5 py-5 cursor-pointer hover:opacity-90 transition-opacity"
          style={{ borderBottom: "1px solid rgba(38,208,206,0.1)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm"
            style={{ background: TEAL, color: NAVY }}
          >
            ◈
          </div>
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 400 }}>
            FaceLog
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
          {NAV.map((item) => {
            const active = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setPage(item.key)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-all duration-150 w-full"
                style={{
                  background: active ? "rgba(38,208,206,0.12)" : "transparent",
                  color: active ? TEAL : "rgba(240,246,255,0.5)",
                  border: active ? "1px solid rgba(38,208,206,0.2)" : "1px solid transparent",
                  fontWeight: active ? 500 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(240,246,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.key === "scanner" && log.length > 0 && (
                  <span
                    className="ml-auto px-1.5 py-0.5 rounded text-xs"
                    style={{
                      background: "rgba(38,208,206,0.15)",
                      color: TEAL,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                    }}
                  >
                    {log.length}
                  </span>
                )}
                {item.key === "enroll" && customEnrolled.length > 0 && (
                  <span
                    className="ml-auto px-1.5 py-0.5 rounded text-xs"
                    style={{
                      background: "rgba(167,139,250,0.15)",
                      color: "#a78bfa",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                    }}
                  >
                    {customEnrolled.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom info */}
        <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(38,208,206,0.08)" }}>
          <div
            style={{
              fontSize: 10,
              color: "rgba(240,246,255,0.35)",
              fontFamily: "'JetBrains Mono', monospace",
              lineHeight: 1.6,
            }}
          >
            {students.length} enrolled<br />
            MODEL v2.4 · EDGE
          </div>
        </div>
      </aside>

      {/* Page content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {page === "home" && (
          <ProductHome
            onNavigate={(p) => setPage(p)}
            studentsCount={students.length}
            totalIn={totalIn}
            attendanceRecords={attendanceRecords}
          />
        )}
        {page === "scanner" && (
          <LiveScanner
            students={students}
            onLog={handleLog}
            log={log}
            totalIn={totalIn}
            totalOut={totalOut}
          />
        )}
        {page === "attendance" && (
          <AttendancePage
            students={students}
            attendanceRecords={attendanceRecords}
          />
        )}
        {page === "enroll" && (
          <EnrollPage
            onEnroll={handleEnroll}
            enrolled={customEnrolled}
          />
        )}
      </main>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInRow {
          from { opacity: 0; background: rgba(38,208,206,0.12); }
          to   { opacity: 1; background: rgba(38,208,206,0.04); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
