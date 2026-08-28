'use client';

import { STUDENTS, ATTENDANCE } from '../data/figmaData';
import type { Student, AttendanceRecord } from '../data/figmaData';
import type { LogEntry } from '../components/figma/LiveScanner';

const STORAGE_STUDENTS_KEY = 'facelog_enrolled_students_v1';
const STORAGE_ATTENDANCE_KEY = 'facelog_attendance_records_v1';
const STORAGE_LOGS_KEY = 'facelog_live_logs_v1';

export const TODAY_DATE_STR = '2026-08-28';

/**
 * Loads all students from localStorage (or fallback to INITIAL STUDENTS)
 */
export function getInitialStudents(): Student[] {
  if (typeof window === 'undefined') return STUDENTS;
  try {
    const saved = localStorage.getItem(STORAGE_STUDENTS_KEY);
    if (saved) {
      const parsed: Student[] = JSON.parse(saved);
      // Merge with default initial students to preserve default dataset
      const existingIds = new Set(parsed.map((s) => s.id));
      const combined = [...parsed];
      for (const st of STUDENTS) {
        if (!existingIds.has(st.id)) {
          combined.push(st);
        }
      }
      return combined;
    }
  } catch (e) {
    console.warn('Storage read error for students:', e);
  }
  return STUDENTS;
}

/**
 * Saves enrolled student to localStorage
 */
export function saveEnrolledStudent(newStudent: Student): Student[] {
  const current = getInitialStudents();
  const updated = [...current.filter((s) => s.id !== newStudent.id), newStudent];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_STUDENTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage write error for students:', e);
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

/**
 * Records live check-in / check-out into the persistent attendance database
 */
export function recordLiveAttendance(
  student: Student,
  time: Date,
  type: 'in' | 'out',
  currentRecords: AttendanceRecord[]
): { updatedRecords: AttendanceRecord[]; status: 'present' | 'late' | 'absent' } {
  const dateStr = TODAY_DATE_STR;
  const timeStr = time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  // Find existing record for this student for today
  const existingIdx = currentRecords.findIndex(
    (r) => r.studentId === student.id && r.date === dateStr
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
    };

    updatedRecords = [
      ...currentRecords.slice(0, existingIdx),
      updatedRecord,
      ...currentRecords.slice(existingIdx + 1),
    ];
  } else {
    finalStatus = isLate ? 'late' : 'present';
    const newRecord: AttendanceRecord = {
      id: `${student.id}-${dateStr}`,
      studentId: student.id,
      date: dateStr,
      checkIn: timeStr,
      checkOut: type === 'out' ? timeStr : null,
      status: finalStatus,
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
