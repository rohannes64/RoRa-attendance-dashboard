'use client';

import React, { useState, useEffect } from "react";
import { STUDENTS, type Student, type AttendanceRecord } from "../data/figmaData";
import { type LogEntry } from "../components/figma/LiveScanner";
import HomePage, { type Session } from "../components/attendance/HomePage";
import SessionPage from "../components/attendance/SessionPage";
import AdminDashboard from "../components/admin/AdminDashboard";
import {
  getInitialSessions,
  saveSession,
  updateSession,
  deleteSession,
  startSession,
  endSession,
  getInitialStudents,
  saveEnrolledStudent,
  updateStudent,
  deleteStudent,
  getInitialAttendance,
  saveAttendanceRecord,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  getInitialLogs,
  recordLiveAttendance,
  saveLiveLogs,
  TODAY_DATE_STR,
} from "../lib/attendanceStore";

type ViewState = "home" | "session" | "admin";

export default function App() {
  const [view, setView] = useState<ViewState>("home");
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [students, setStudents] = useState<Student[]>(STUDENTS);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [totalIn, setTotalIn] = useState(0);
  const [totalOut, setTotalOut] = useState(0);

  // Initialize from persistent database
  useEffect(() => {
    const loadedSessions = getInitialSessions();
    const loadedStudents = getInitialStudents();
    const loadedAttendance = getInitialAttendance();
    const loadedLogs = getInitialLogs();

    setSessions(loadedSessions);
    setStudents(loadedStudents);
    setAttendanceRecords(loadedAttendance);
    setLog(loadedLogs);

    const ins = loadedLogs.filter((l) => l.type === "in").length;
    const outs = loadedLogs.filter((l) => l.type === "out").length;
    setTotalIn(ins);
    setTotalOut(outs);
  }, []);

  function handleLog(entry: LogEntry) {
    const updatedLogs = [entry, ...log].slice(0, 50);
    setLog(updatedLogs);
    saveLiveLogs(updatedLogs);

    if (entry.type === "in") setTotalIn((n) => n + 1);
    else setTotalOut((n) => n + 1);

    const currentSessionId = activeSession?.id;

    const { updatedRecords } = recordLiveAttendance(
      entry.student,
      entry.time,
      entry.type,
      attendanceRecords,
      currentSessionId
    );
    setAttendanceRecords(updatedRecords);

    // Update present count on active session
    if (activeSession && entry.type === "in") {
      const updatedSess = { ...activeSession, present: activeSession.present + 1 };
      setActiveSession(updatedSess);
      setSessions((prev) => prev.map((s) => (s.id === updatedSess.id ? updatedSess : s)));
    }
  }

  // --- SESSION LIFECYCLE HANDLERS ---
  function handleStartSession(session: Session) {
    const updated = startSession(session.id);
    setSessions(updated);
    const refreshed = updated.find((s) => s.id === session.id) || { ...session, status: "active" as const };
    setActiveSession(refreshed);
    setView("session");
  }

  function handleEndSession(session: Session) {
    const updated = endSession(session.id);
    setSessions(updated);
    if (activeSession && activeSession.id === session.id) {
      const refreshed = updated.find((s) => s.id === session.id) || { ...session, status: "completed" as const };
      setActiveSession(refreshed);
    }
  }

  // --- SESSIONS CRUD HANDLERS ---
  function handleSaveSession(newSession: Session) {
    const updated = saveSession(newSession);
    setSessions(updated);
  }

  function handleUpdateSession(session: Session) {
    const updated = updateSession(session);
    setSessions(updated);
    if (activeSession && activeSession.id === session.id) {
      setActiveSession(session);
    }
  }

  function handleDeleteSession(id: string) {
    const updated = deleteSession(id);
    setSessions(updated);
    if (activeSession && activeSession.id === id) {
      setActiveSession(null);
      setView("home");
    }
  }

  // --- STUDENTS CRUD HANDLERS ---
  function handleEnrollStudent(student: Student) {
    const updated = saveEnrolledStudent(student);
    setStudents(updated);
  }

  function handleUpdateStudent(student: Student) {
    const updated = updateStudent(student);
    setStudents(updated);
  }

  function handleDeleteStudent(id: string) {
    const updated = deleteStudent(id);
    setStudents(updated);
  }

  // --- ATTENDANCE CRUD & STATUS TOGGLE ---
  function handleMarkStudentAttendance(
    sessionId: string,
    studentId: string,
    status: "present" | "late" | "absent"
  ) {
    const timeStr = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const existingIdx = attendanceRecords.findIndex(
      (r) => r.studentId === studentId && (r.sessionId === sessionId || r.date === TODAY_DATE_STR)
    );

    let updated: AttendanceRecord[];
    if (existingIdx >= 0) {
      const existing = attendanceRecords[existingIdx];
      const updatedRec: AttendanceRecord = {
        ...existing,
        status,
        sessionId,
        checkIn: status !== "absent" ? (existing.checkIn || timeStr) : null,
        markedVia: "manual",
      };
      updated = [
        ...attendanceRecords.slice(0, existingIdx),
        updatedRec,
        ...attendanceRecords.slice(existingIdx + 1),
      ];
    } else {
      const newRec: AttendanceRecord = {
        id: `att-${studentId}-${sessionId}`,
        studentId,
        sessionId,
        date: TODAY_DATE_STR,
        checkIn: status !== "absent" ? timeStr : null,
        checkOut: null,
        status,
        markedVia: "manual",
      };
      updated = [newRec, ...attendanceRecords];
    }

    setAttendanceRecords(updated);
    saveAttendanceRecord(updated[0]);

    // Recalculate present count for session
    const currentSess = sessions.find((s) => s.id === sessionId);
    if (currentSess) {
      const sessionRecs = updated.filter((r) => r.sessionId === sessionId);
      const presentCount = sessionRecs.filter((r) => r.status === "present" || r.status === "late").length;
      const updatedSess = { ...currentSess, present: presentCount };
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updatedSess : s)));
      if (activeSession && activeSession.id === sessionId) {
        setActiveSession(updatedSess);
      }
    }
  }

  function handleSaveAttendance(record: AttendanceRecord) {
    const updated = saveAttendanceRecord(record);
    setAttendanceRecords(updated);
  }

  function handleUpdateAttendance(record: AttendanceRecord) {
    const updated = updateAttendanceRecord(record);
    setAttendanceRecords(updated);
  }

  function handleDeleteAttendance(id: string) {
    const updated = deleteAttendanceRecord(id);
    setAttendanceRecords(updated);
  }

  return (
    <div className="w-full h-full min-h-screen bg-[#140E07]">
      {view === "admin" ? (
        <AdminDashboard
          sessions={sessions}
          students={students}
          attendanceRecords={attendanceRecords}
          onBack={() => setView("home")}
          onSaveSession={handleSaveSession}
          onUpdateSession={handleUpdateSession}
          onDeleteSession={handleDeleteSession}
          onSaveStudent={handleEnrollStudent}
          onUpdateStudent={handleUpdateStudent}
          onDeleteStudent={handleDeleteStudent}
          onSaveAttendance={handleSaveAttendance}
          onUpdateAttendance={handleUpdateAttendance}
          onDeleteAttendance={handleDeleteAttendance}
        />
      ) : view === "session" && activeSession ? (
        <SessionPage
          session={activeSession}
          onBack={() => {
            setActiveSession(null);
            setView("home");
          }}
          students={students}
          attendanceRecords={attendanceRecords}
          log={log}
          totalIn={totalIn}
          totalOut={totalOut}
          onLog={handleLog}
          onEnroll={handleEnrollStudent}
          onOpenAdminConsole={() => setView("admin")}
          onStartSession={handleStartSession}
          onEndSession={handleEndSession}
          onMarkStudentAttendance={handleMarkStudentAttendance}
          onDeleteAttendanceRecord={handleDeleteAttendance}
          onUpdateStudent={handleUpdateStudent}
          onDeleteStudent={handleDeleteStudent}
        />
      ) : (
        <HomePage
          sessions={sessions}
          students={students}
          attendanceRecords={attendanceRecords}
          onSelectSession={(s) => {
            setActiveSession(s);
            setView("session");
          }}
          totalEnrolledCount={students.length}
          onOpenAdminConsole={() => setView("admin")}
          onCreateSession={() => setView("admin")}
          onEditSession={(s) => {
            setActiveSession(s);
            setView("admin");
          }}
          onDeleteSession={handleDeleteSession}
          onStartSession={handleStartSession}
          onEndSession={handleEndSession}
        />
      )}
    </div>
  );
}
