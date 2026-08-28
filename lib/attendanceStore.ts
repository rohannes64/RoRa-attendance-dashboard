'use client';

import { STUDENTS, ATTENDANCE } from '../data/figmaData';
import type { Student, AttendanceRecord } from '../data/figmaData';
import type { LogEntry } from '../components/figma/LiveScanner';

const STORAGE_STUDENTS_KEY = 'facelog_enrolled_students_v1';
const STORAGE_ATTENDANCE_KEY = 'facelog_attendance_records_v1';
const STORAGE_SESSIONS_KEY = 'facelog_sessions_v1';
const STORAGE_LOGS_KEY = 'facelog_live_logs_v1';

export const TODAY_DATE_STR = '2026-08-28';

import { SESSIONS, type Session } from '../components/attendance/HomePage';

/**
 * Loads all class sessions from localStorage (or fallback to SESSIONS)
 */
export function getInitialSessions(): Session[] {
  if (typeof window === 'undefined') return SESSIONS;
  try {
    const saved = localStorage.getItem(STORAGE_SESSIONS_KEY);
    if (saved) {
      const parsed: Session[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Storage read error for sessions:', e);
  }
  return SESSIONS;
}

export function saveSession(newSession: Session): Session[] {
  const current = getInitialSessions();
  const updated = [newSession, ...current.filter((s) => s.id !== newSession.id)];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage write error for session:', e);
    }
  }
  return updated;
}

export function updateSession(session: Session): Session[] {
  const current = getInitialSessions();
  const updated = current.map((s) => (s.id === session.id ? session : s));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage write error for session update:', e);
    }
  }
  return updated;
}

export function deleteSession(sessionId: string): Session[] {
  const current = getInitialSessions();
  const updated = current.filter((s) => s.id !== sessionId);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage write error for session delete:', e);
    }
  }
  return updated;
}

/**
 * Loads all students from localStorage (or fallback to INITIAL STUDENTS)
 */
export function getInitialStudents(): Student[] {
  if (typeof window === 'undefined') return STUDENTS;
  try {
    const saved = localStorage.getItem(STORAGE_STUDENTS_KEY);
    if (saved) {
      const parsed: Student[] = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Storage read error for students:', e);
  }
  // Initialize storage with initial STUDENTS if not set yet
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_STUDENTS_KEY, JSON.stringify(STUDENTS));
    } catch {}
  }
  return STUDENTS;
}

/**
 * Saves enrolled student to localStorage
 */
export function saveEnrolledStudent(newStudent: Student): Student[] {
  const current = getInitialStudents();
  const updated = [newStudent, ...current.filter((s) => s.id !== newStudent.id && s.studentId !== newStudent.studentId)];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_STUDENTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage write error for students:', e);
    }
  }
  return updated;
}

export function updateStudent(updatedStudent: Student): Student[] {
  const current = getInitialStudents();
  const updated = current.map((s) => (s.id === updatedStudent.id || s.studentId === updatedStudent.studentId ? updatedStudent : s));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_STUDENTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage write error for student update:', e);
    }
  }
  return updated;
}

export function deleteStudent(studentId: string): Student[] {
  const current = getInitialStudents();
  const updated = current.filter((s) => s.id !== studentId && s.studentId !== studentId);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_STUDENTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage write error for student delete:', e);
    }
  }
  return updated;
}

/**
 * Loads all attendance records from localStorage (or fallback to INITIAL ATTENDANCE)
 */
export function getInitialAttendance(): AttendanceRecord[] {
  if (typeof window === 'undefined') return ATTENDANCE;
  try {
    const saved = localStorage.getItem(STORAGE_ATTENDANCE_KEY);
    if (saved) {
      const parsed: AttendanceRecord[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Storage read error for attendance:', e);
  }
  return ATTENDANCE;
}

export function saveAttendanceRecord(record: AttendanceRecord): AttendanceRecord[] {
  const current = getInitialAttendance();
  const updated = [record, ...current.filter((r) => r.id !== record.id)];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_ATTENDANCE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage write error for attendance record:', e);
    }
  }
  return updated;
}

export function updateAttendanceRecord(record: AttendanceRecord): AttendanceRecord[] {
  const current = getInitialAttendance();
  const updated = current.map((r) => (r.id === record.id ? record : r));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_ATTENDANCE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage write error for attendance update:', e);
    }
  }
  return updated;
}

export function deleteAttendanceRecord(recordId: string): AttendanceRecord[] {
  const current = getInitialAttendance();
  const updated = current.filter((r) => r.id !== recordId);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_ATTENDANCE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage write error for attendance delete:', e);
    }
  }
  return updated;
}

export function startSession(sessionId: string): Session[] {
  const current = getInitialSessions();
  const nowStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const updated = current.map((s) =>
    s.id === sessionId
      ? { ...s, status: "active" as const, startedAt: s.startedAt || nowStr }
      : s
  );
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage write error for startSession:', e);
    }
  }
  return updated;
}

export function endSession(sessionId: string): Session[] {
  const current = getInitialSessions();
  const nowStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const updated = current.map((s) =>
    s.id === sessionId
      ? { ...s, status: "completed" as const, endedAt: nowStr }
      : s
  );
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage write error for endSession:', e);
    }
  }
  return updated;
}

/**
 * Records live check-in / check-out into the persistent attendance database
 */
export function recordLiveAttendance(
  student: Student,
  time: Date,
  type: 'in' | 'out',
  currentRecords: AttendanceRecord[],
  sessionId?: string
): { updatedRecords: AttendanceRecord[]; status: 'present' | 'late' | 'absent' } {
  const dateStr = TODAY_DATE_STR;
  const timeStr = time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const existingIdx = currentRecords.findIndex(
    (r) => r.studentId === student.id && (sessionId ? r.sessionId === sessionId : r.date === dateStr)
  );

  let updatedRecords: AttendanceRecord[] = [];
  let finalStatus: 'present' | 'late' | 'absent' = 'present';

  const [hours, minutes] = timeStr.split(':').map(Number);
  const isLate = hours > 8 || (hours === 8 && minutes > 15);

  if (existingIdx >= 0) {
    const existing = currentRecords[existingIdx];
    finalStatus = existing.status === 'absent' ? (isLate ? 'late' : 'present') : existing.status;

    const updatedRecord: AttendanceRecord = {
      ...existing,
      checkIn: type === 'in' ? (existing.checkIn || timeStr) : existing.checkIn || timeStr,
      checkOut: type === 'out' ? timeStr : existing.checkOut,
      status: finalStatus,
      sessionId: sessionId || existing.sessionId,
      markedVia: 'ai_face',
    };

    updatedRecords = [
      ...currentRecords.slice(0, existingIdx),
      updatedRecord,
      ...currentRecords.slice(existingIdx + 1),
    ];
  } else {
    finalStatus = isLate ? 'late' : 'present';
    const newRecord: AttendanceRecord = {
      id: `${student.id}-${sessionId || dateStr}`,
      studentId: student.id,
      sessionId: sessionId,
      date: dateStr,
      checkIn: timeStr,
      checkOut: type === 'out' ? timeStr : null,
      status: finalStatus,
      markedVia: 'ai_face',
    };
    updatedRecords = [newRecord, ...currentRecords];
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_ATTENDANCE_KEY, JSON.stringify(updatedRecords));
    } catch (e) {
      console.warn('Storage write error for attendance:', e);
    }
  }

  return { updatedRecords, status: finalStatus };
}

/**
 * Loads live logs from storage
 */
export function getInitialLogs(): LogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_LOGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((item: LogEntry & { time: string }) => ({
        ...item,
        time: new Date(item.time),
      }));
    }
  } catch (e) {
    console.warn('Storage read error for logs:', e);
  }
  return [];
}

/**
 * Saves live logs to storage
 */
export function saveLiveLogs(logs: LogEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(logs.slice(0, 50)));
  } catch (e) {
    console.warn('Storage write error for logs:', e);
  }
}
