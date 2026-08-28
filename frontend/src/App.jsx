import React, { useState, useEffect } from "react";
import HomePage from "./components/home/HomePage";
import SessionPage from "./components/session/SessionPage";
import AdminConsole from "./components/admin/AdminConsole";
import {
  fetchSessionsAPI,
  createSessionAPI,
  updateSessionAPI,
  startSessionAPI,
  endSessionAPI,
  deleteSessionAPI,
  fetchStudentsAPI,
  createStudentAPI,
  updateStudentAPI,
  deleteStudentAPI,
  fetchAttendanceAPI,
  markStudentStatusAPI,
  deleteAttendanceAPI,
} from "./api/client";

// Seed fallback data for client state initialization
const INITIAL_STUDENTS = [
  { id: "1", customId: "1", name: "Aarav Sharma", studentId: "STU-2401", department: "Computer Science", year: "Year 3", avatar: "AS", enrolledDate: "2024-01-15" },
  { id: "2", customId: "2", name: "Priya Nair", studentId: "STU-2402", department: "Data Science", year: "Year 2", avatar: "PN", enrolledDate: "2024-01-15" },
  { id: "3", customId: "3", name: "Rohan Verma", studentId: "STU-2403", department: "Electrical Eng.", year: "Year 4", avatar: "RV", enrolledDate: "2024-01-16" },
  { id: "4", customId: "4", name: "Ananya Iyer", studentId: "STU-2404", department: "Mathematics", year: "Year 1", avatar: "AI", enrolledDate: "2024-01-16" },
  { id: "5", customId: "5", name: "Vikram Malhotra", studentId: "STU-2405", department: "Computer Science", year: "Year 3", avatar: "VM", enrolledDate: "2024-01-17" },
  { id: "6", customId: "6", name: "Sneha Reddy", studentId: "STU-2406", department: "Data Science", year: "Year 2", avatar: "SR", enrolledDate: "2024-01-17" },
];

const INITIAL_SESSIONS = [
  {
    id: "cs301",
    sessionId: "cs301",
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
    sessionId: "ds201",
    subject: "Data Structures",
    code: "DS 201",
    instructor: "Prof. Lena Hartmann",
    time: "10:00 – 11:30",
    room: "Hall A",
    enrolled: 6,
    present: 5,
    color: "#E8943A",
    status: "upcoming",
    enrolledStudentIds: ["2", "4", "6", "8", "9", "10"],
  },
  {
    id: "cv401",
    sessionId: "cv401",
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
    id: "db302",
    sessionId: "db302",
    subject: "Database Systems",
    code: "DB 302",
    instructor: "Prof. Malik James",
    time: "09:00 – 10:30",
    room: "Hall B",
    enrolled: 6,
    present: 5,
    color: "#B8601A",
    status: "completed",
    enrolledStudentIds: ["1", "4", "5", "8", "9", "10"],
    startedAt: "09:00 AM",
    endedAt: "10:30 AM",
  },
];

export default function App() {
  const [view, setView] = useState("home");
  const [activeSession, setActiveSession] = useState(null);

  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [log, setLog] = useState([]);

  useEffect(() => {
    async function initData() {
      const fetchedSess = await fetchSessionsAPI();
      if (fetchedSess && fetchedSess.length > 0) setSessions(fetchedSess);

      const fetchedStud = await fetchStudentsAPI();
      if (fetchedStud && fetchedStud.length > 0) setStudents(fetchedStud);

      const fetchedAtt = await fetchAttendanceAPI();
      if (fetchedAtt) setAttendanceRecords(fetchedAtt);
    }
    initData();
  }, []);

  function handleLog(entry) {
    const updatedLogs = [entry, ...log].slice(0, 50);
    setLog(updatedLogs);

    // Sync match with backend
    if (activeSession) {
      markStudentStatusAPI(activeSession.id || activeSession.sessionId, entry.student.id, "present").then((res) => {
        if (res) {
          setAttendanceRecords((prev) => [res, ...prev.filter((r) => r.id !== res.id)]);
        }
      });
    }
  }

  // Session Handlers
  async function handleStartSession(session) {
    const sId = session.id || session.sessionId;
    await startSessionAPI(sId);
    const updated = sessions.map((s) => (s.id === sId || s.sessionId === sId ? { ...s, status: "active", startedAt: "Just now" } : s));
    setSessions(updated);
    const active = updated.find((s) => s.id === sId || s.sessionId === sId);
    setActiveSession(active);
    setView("session");
  }

  async function handleEndSession(session) {
    const sId = session.id || session.sessionId;
    await endSessionAPI(sId);
    const updated = sessions.map((s) => (s.id === sId || s.sessionId === sId ? { ...s, status: "completed", endedAt: "Just now" } : s));
    setSessions(updated);
    if (activeSession && (activeSession.id === sId || activeSession.sessionId === sId)) {
      setActiveSession(updated.find((s) => s.id === sId || s.sessionId === sId));
    }
  }

  async function handleCreateSession(sessionData) {
    const res = await createSessionAPI(sessionData);
    const newSess = res || sessionData;
    setSessions([newSess, ...sessions.filter((s) => (s.id || s.sessionId) !== (newSess.id || newSess.sessionId))]);
  }

  async function handleUpdateSession(sessionData) {
    const sId = sessionData.id || sessionData.sessionId;
    await updateSessionAPI(sId, sessionData);
    setSessions(sessions.map((s) => (s.id === sId || s.sessionId === sId ? sessionData : s)));
  }

  async function handleDeleteSession(id) {
    await deleteSessionAPI(id);
    setSessions(sessions.filter((s) => s.id !== id && s.sessionId !== id));
    if (activeSession && (activeSession.id === id || activeSession.sessionId === id)) {
      setActiveSession(null);
      setView("home");
    }
  }

  // Student Handlers
  async function handleSaveStudent(studentData) {
    const res = await createStudentAPI(studentData);
    const newSt = res || studentData;
    setStudents([newSt, ...students.filter((s) => s.id !== newSt.id && s.studentId !== newSt.studentId)]);
  }

  async function handleUpdateStudent(studentData) {
    const sId = studentData.id || studentData.customId;
    await updateStudentAPI(sId, studentData);
    setStudents(students.map((s) => (s.id === sId || s.customId === sId ? studentData : s)));
  }

  async function handleDeleteStudent(id) {
    await deleteStudentAPI(id);
    setStudents(students.filter((s) => s.id !== id && s.studentId !== id && s.customId !== id));
  }

  // Attendance Handlers
  async function handleMarkStudentStatus(sessionId, studentId, status) {
    const res = await markStudentStatusAPI(sessionId, studentId, status);
    const rId = res?.id || `att-${studentId}-${sessionId}`;
    const newRec = res || { id: rId, sessionId, studentId, status, date: "2026-08-28" };

    const updated = [newRec, ...attendanceRecords.filter((r) => r.id !== rId && r.recordId !== rId)];
    setAttendanceRecords(updated);
  }

  async function handleDeleteAttendance(id) {
    await deleteAttendanceAPI(id);
    setAttendanceRecords(attendanceRecords.filter((r) => r.id !== id && r.recordId !== id));
  }

  return (
    <div className="w-full h-full min-h-screen bg-[#140E07]">
      {view === "admin" ? (
        <AdminConsole
          sessions={sessions}
          students={students}
          attendanceRecords={attendanceRecords}
          onBack={() => setView("home")}
          onSaveSession={handleCreateSession}
          onUpdateSession={handleUpdateSession}
          onDeleteSession={handleDeleteSession}
          onSaveStudent={handleSaveStudent}
          onUpdateStudent={handleUpdateStudent}
          onDeleteStudent={handleDeleteStudent}
          onSaveAttendance={(r) => handleMarkStudentStatus(r.sessionId, r.studentId, r.status)}
          onUpdateAttendance={(r) => handleMarkStudentStatus(r.sessionId, r.studentId, r.status)}
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
          totalIn={log.filter((l) => l.type === "in").length}
          totalOut={log.filter((l) => l.type === "out").length}
          onLog={handleLog}
          onEnroll={handleSaveStudent}
          onOpenAdminConsole={() => setView("admin")}
          onStartSession={handleStartSession}
          onEndSession={handleEndSession}
          onMarkStudentStatus={handleMarkStudentStatus}
          onDeleteAttendanceRecord={handleDeleteAttendance}
        />
      ) : (
        <HomePage
          sessions={sessions}
          students={students}
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
