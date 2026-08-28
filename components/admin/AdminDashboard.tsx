'use client';

import React, { useState } from "react";
import type { Student, AttendanceRecord } from "../../data/figmaData";
import type { Session } from "../attendance/HomePage";
import { DEPARTMENTS, YEARS } from "../../data/figmaData";

interface Props {
  sessions: Session[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onBack: () => void;
  onSaveSession: (s: Session) => void;
  onUpdateSession: (s: Session) => void;
  onDeleteSession: (id: string) => void;
  onSaveStudent: (s: Student) => void;
  onUpdateStudent: (s: Student) => void;
  onDeleteStudent: (id: string) => void;
  onSaveAttendance: (r: AttendanceRecord) => void;
  onUpdateAttendance: (r: AttendanceRecord) => void;
  onDeleteAttendance: (id: string) => void;
}

type Tab = "sessions" | "students" | "attendance";

export default function AdminDashboard({
  sessions,
  students,
  attendanceRecords,
  onBack,
  onSaveSession,
  onUpdateSession,
  onDeleteSession,
  onSaveStudent,
  onUpdateStudent,
  onDeleteStudent,
  onSaveAttendance,
  onUpdateAttendance,
  onDeleteAttendance,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("sessions");

  // Modal States
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | null>(null);

  // Form states
  const [sessionForm, setSessionForm] = useState<Session>({
    id: "",
    subject: "",
    code: "",
    instructor: "",
    time: "09:00 – 10:30",
    room: "Room 101",
    enrolled: 30,
    present: 0,
    color: "#C4622D",
  });

  const [studentForm, setStudentForm] = useState({
    id: "",
    name: "",
    studentId: "",
    department: DEPARTMENTS[0],
    year: YEARS[0],
  });

  const [attendanceForm, setAttendanceForm] = useState<Partial<AttendanceRecord>>({
    studentId: students[0]?.id || "",
    date: new Date().toISOString().slice(0, 10),
    checkIn: "08:15:00",
    checkOut: null,
    status: "present",
  });

  // Handlers for Session Modal
  const openNewSessionModal = () => {
    setEditingSession(null);
    setSessionForm({
      id: `session-${Date.now()}`,
      subject: "",
      code: "CS 101",
      instructor: "Dr. Faculty",
      time: "09:00 – 10:30",
      room: "Lab 1A",
      enrolled: 30,
      present: 0,
      color: "#C4622D",
    });
    setSessionModalOpen(true);
  };

  const openEditSessionModal = (s: Session) => {
    setEditingSession(s);
    setSessionForm(s);
    setSessionModalOpen(true);
  };

  const handleSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionForm.subject.trim() || !sessionForm.code.trim()) return;
    if (editingSession) {
      onUpdateSession(sessionForm);
    } else {
      onSaveSession(sessionForm);
    }
    setSessionModalOpen(false);
  };

  // Handlers for Student Modal
  const openNewStudentModal = () => {
    setEditingStudent(null);
    setStudentForm({
      id: `custom-${Date.now()}`,
      name: "",
      studentId: `STU-2026-${Math.floor(100 + Math.random() * 900)}`,
      department: DEPARTMENTS[0],
      year: YEARS[0],
    });
    setStudentModalOpen(true);
  };

  const openEditStudentModal = (st: Student) => {
    setEditingStudent(st);
    setStudentForm({
      id: st.id,
      name: st.name,
      studentId: st.studentId || st.id,
      department: st.department || DEPARTMENTS[0],
      year: st.year || YEARS[0],
    });
    setStudentModalOpen(true);
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.name.trim()) return;
    const st: Student = {
      id: studentForm.id,
      name: studentForm.name.trim(),
      studentId: studentForm.studentId.trim(),
      department: studentForm.department,
      year: studentForm.year,
      avatar: studentForm.name.slice(0, 2).toUpperCase(),
      enrolledDate: editingStudent?.enrolledDate || new Date().toISOString().slice(0, 10),
      descriptor: editingStudent?.descriptor,
      photo: editingStudent?.photo,
    };
    if (editingStudent) {
      onUpdateStudent(st);
    } else {
      onSaveStudent(st);
    }
    setStudentModalOpen(false);
  };

  // Handlers for Attendance Modal
  const openNewAttendanceModal = () => {
    setEditingAttendance(null);
    setAttendanceForm({
      id: `att-${Date.now()}`,
      studentId: students[0]?.id || "",
      date: new Date().toISOString().slice(0, 10),
      checkIn: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      checkOut: null,
      status: "present",
    });
    setAttendanceModalOpen(true);
  };

  const handleAttendanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendanceForm.studentId || !attendanceForm.date) return;
    const rec: AttendanceRecord = {
      id: attendanceForm.id || `att-${Date.now()}`,
      studentId: attendanceForm.studentId,
      date: attendanceForm.date,
      checkIn: attendanceForm.checkIn || "08:15:00",
      checkOut: attendanceForm.checkOut || null,
      status: attendanceForm.status || "present",
    };
    if (editingAttendance) {
      onUpdateAttendance(rec);
    } else {
      onSaveAttendance(rec);
    }
    setAttendanceModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#140E07] text-[#F0E2C8]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-[#140E07]/95 backdrop-blur border-b border-[#2A1F13]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2A1F13] bg-[#1E1610] text-[#A89070] hover:text-[#F0E2C8] hover:border-[#C4622D] transition-all text-xs font-semibold"
            >
              ← Back to App
            </button>
            <div className="w-px h-5 bg-[#2A1F13]" />
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C4622D] animate-pulse" />
                <h1 className="font-serif text-xl text-[#F0E2C8]">Single-Page Admin Console</h1>
              </div>
              <p className="text-[11px] text-[#A89070]">Full CRUD Control Center for Sessions, Students & Attendance</p>
            </div>
          </div>

          {/* Action Tabs */}
          <div className="flex gap-1 bg-[#1E1610] rounded-xl p-1 border border-[#2A1F13]">
            {[
              { id: "sessions" as const, label: `Sessions (${sessions.length})` },
              { id: "students" as const, label: `Students (${students.length})` },
              { id: "attendance" as const, label: `Attendance (${attendanceRecords.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === tab.id
                    ? "bg-[#C4622D] text-[#F0E2C8] shadow-md"
                    : "text-[#A89070] hover:text-[#F0E2C8]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Telemetry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-[#2A1F13] bg-[#1E1610] p-5 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-[#A89070] font-semibold mb-1">Class Sessions</div>
              <div className="font-serif text-3xl text-[#E8943A]">{sessions.length}</div>
            </div>
            <button
              onClick={openNewSessionModal}
              className="px-3.5 py-2 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold transition-all shadow-md"
            >
              + Add Session
            </button>
          </div>

          <div className="rounded-2xl border border-[#2A1F13] bg-[#1E1610] p-5 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-[#A89070] font-semibold mb-1">Enrolled Students</div>
              <div className="font-serif text-3xl text-[#E8943A]">{students.length}</div>
            </div>
            <button
              onClick={openNewStudentModal}
              className="px-3.5 py-2 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold transition-all shadow-md"
            >
              + Add Student
            </button>
          </div>

          <div className="rounded-2xl border border-[#2A1F13] bg-[#1E1610] p-5 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-[#A89070] font-semibold mb-1">Attendance Records</div>
              <div className="font-serif text-3xl text-[#E8943A]">{attendanceRecords.length}</div>
            </div>
            <button
              onClick={openNewAttendanceModal}
              className="px-3.5 py-2 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold transition-all shadow-md"
            >
              + Manual Entry
            </button>
          </div>
        </div>

        {/* TAB 1: SESSIONS MANAGER */}
        {activeTab === "sessions" && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl text-[#F0E2C8]">Class Sessions Manager</h2>
                <p className="text-xs text-[#A89070]">Create, edit schedule/instructors, and delete class sessions</p>
              </div>
              <button
                onClick={openNewSessionModal}
                className="px-4 py-2 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold transition-all shadow-md"
              >
                + Create New Session
              </button>
            </div>

            <div className="rounded-2xl border border-[#2A1F13] bg-[#1E1610] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#140E07] border-b border-[#2A1F13] text-[#A89070] text-xs uppercase tracking-widest">
                    <th className="text-left px-5 py-3.5">Code</th>
                    <th className="text-left px-5 py-3.5">Subject</th>
                    <th className="text-left px-5 py-3.5">Instructor</th>
                    <th className="text-left px-5 py-3.5">Schedule</th>
                    <th className="text-left px-5 py-3.5">Room</th>
                    <th className="text-left px-5 py-3.5">Enrolled</th>
                    <th className="text-right px-5 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s, i) => (
                    <tr
                      key={s.id}
                      className={`border-b border-[#2A1F13] last:border-0 hover:bg-[#251C15] transition-colors ${
                        i % 2 === 0 ? "bg-[#1E1610]" : "bg-[#18110B]"
                      }`}
                    >
                      <td className="px-5 py-4 font-mono text-xs text-[#C4622D] font-semibold">{s.code}</td>
                      <td className="px-5 py-4 font-medium text-[#F0E2C8]">{s.subject}</td>
                      <td className="px-5 py-4 text-[#A89070] text-xs">{s.instructor}</td>
                      <td className="px-5 py-4 text-[#A89070] text-xs font-mono">{s.time}</td>
                      <td className="px-5 py-4 text-[#A89070] text-xs">{s.room}</td>
                      <td className="px-5 py-4 text-[#A89070] text-xs font-mono">{s.enrolled} students</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditSessionModal(s)}
                            className="px-2.5 py-1 rounded-lg border border-[#2A1F13] bg-[#140E07] text-[#E8943A] hover:bg-[#C4622D]/20 text-xs font-medium transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDeleteSession(s.id)}
                            className="px-2.5 py-1 rounded-lg border border-rose-900/50 bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 text-xs font-medium transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: STUDENTS MANAGER */}
        {activeTab === "students" && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl text-[#F0E2C8]">Enrolled Students Manager</h2>
                <p className="text-xs text-[#A89070]">Register, edit profile metadata, and delete student records</p>
              </div>
              <button
                onClick={openNewStudentModal}
                className="px-4 py-2 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold transition-all shadow-md"
              >
                + Add New Student
              </button>
            </div>

            <div className="rounded-2xl border border-[#2A1F13] bg-[#1E1610] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#140E07] border-b border-[#2A1F13] text-[#A89070] text-xs uppercase tracking-widest">
                    <th className="text-left px-5 py-3.5">Student Name</th>
                    <th className="text-left px-5 py-3.5">Student / Roll ID</th>
                    <th className="text-left px-5 py-3.5">Department</th>
                    <th className="text-left px-5 py-3.5">Year</th>
                    <th className="text-left px-5 py-3.5">Biometric Status</th>
                    <th className="text-right px-5 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((st, i) => {
                    const hasBiometrics = !!st.descriptor;
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
                        <td className="px-5 py-4 text-[#A89070] text-xs">{st.year || "3rd Year"}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              hasBiometrics
                                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-950/60 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${hasBiometrics ? "bg-emerald-400" : "bg-amber-400"}`} />
                            {hasBiometrics ? "128D FaceNet Vector" : "Default Dataset"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditStudentModal(st)}
                              className="px-2.5 py-1 rounded-lg border border-[#2A1F13] bg-[#140E07] text-[#E8943A] hover:bg-[#C4622D]/20 text-xs font-medium transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onDeleteStudent(st.id)}
                              className="px-2.5 py-1 rounded-lg border border-rose-900/50 bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 text-xs font-medium transition-all"
                            >
                              Delete
                            </button>
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

        {/* TAB 3: ATTENDANCE MASTER LEDGER */}
        {activeTab === "attendance" && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl text-[#F0E2C8]">Master Attendance Ledger</h2>
                <p className="text-xs text-[#A89070]">System-wide check-in logs, inline status modification, and record purging</p>
              </div>
              <button
                onClick={openNewAttendanceModal}
                className="px-4 py-2 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold transition-all shadow-md"
              >
                + Add Manual Record
              </button>
            </div>

            <div className="rounded-2xl border border-[#2A1F13] bg-[#1E1610] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#140E07] border-b border-[#2A1F13] text-[#A89070] text-xs uppercase tracking-widest">
                    <th className="text-left px-5 py-3.5">Student Name</th>
                    <th className="text-left px-5 py-3.5">Date</th>
                    <th className="text-left px-5 py-3.5">Check-In</th>
                    <th className="text-left px-5 py-3.5">Check-Out</th>
                    <th className="text-left px-5 py-3.5">Attendance Status</th>
                    <th className="text-right px-5 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((r, i) => {
                    const st = students.find((s) => s.id === r.studentId) || { name: r.studentId, studentId: r.studentId };
                    return (
                      <tr
                        key={r.id}
                        className={`border-b border-[#2A1F13] last:border-0 hover:bg-[#251C15] transition-colors ${
                          i % 2 === 0 ? "bg-[#1E1610]" : "bg-[#18110B]"
                        }`}
                      >
                        <td className="px-5 py-4 font-medium text-[#F0E2C8]">{st.name}</td>
                        <td className="px-5 py-4 text-[#A89070] font-mono text-xs">{r.date}</td>
                        <td className="px-5 py-4 text-[#A89070] font-mono text-xs">{r.checkIn || "—"}</td>
                        <td className="px-5 py-4 text-[#A89070] font-mono text-xs">{r.checkOut || "—"}</td>
                        <td className="px-5 py-4">
                          <select
                            value={r.status}
                            onChange={(e) =>
                              onUpdateAttendance({
                                ...r,
                                status: e.target.value as "present" | "late" | "absent",
                              })
                            }
                            className="bg-[#140E07] border border-[#2A1F13] rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-[#E8943A]"
                            style={{
                              color:
                                r.status === "present" ? "#34d399" : r.status === "late" ? "#fbbf24" : "#fb7185",
                            }}
                          >
                            <option value="present" className="text-emerald-400 bg-[#140E07]">
                              PRESENT
                            </option>
                            <option value="late" className="text-amber-400 bg-[#140E07]">
                              LATE
                            </option>
                            <option value="absent" className="text-rose-400 bg-[#140E07]">
                              ABSENT
                            </option>
                          </select>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => onDeleteAttendance(r.id)}
                            className="px-2.5 py-1 rounded-lg border border-rose-900/50 bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 text-xs font-medium transition-all"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* SESSION MODAL */}
      {sessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#1E1610] border border-[#2A1F13] rounded-2xl p-6 shadow-2xl animate-fade-in-up">
            <h3 className="font-serif text-xl text-[#F0E2C8] mb-4">
              {editingSession ? "Edit Class Session" : "Create New Class Session"}
            </h3>
            <form onSubmit={handleSessionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">
                  Course / Subject Name
                </label>
                <input
                  value={sessionForm.subject}
                  onChange={(e) => setSessionForm({ ...sessionForm, subject: e.target.value })}
                  placeholder="e.g. Deep Learning & Neural Networks"
                  className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-3.5 py-2.5 text-sm text-[#F0E2C8] focus:outline-none focus:border-[#E8943A]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">
                    Course Code
                  </label>
                  <input
                    value={sessionForm.code}
                    onChange={(e) => setSessionForm({ ...sessionForm, code: e.target.value })}
                    placeholder="CS 402"
                    className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#F0E2C8] focus:outline-none focus:border-[#E8943A]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">
                    Enrolled Count
                  </label>
                  <input
                    type="number"
                    value={sessionForm.enrolled}
                    onChange={(e) => setSessionForm({ ...sessionForm, enrolled: Number(e.target.value) })}
                    className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#F0E2C8] focus:outline-none focus:border-[#E8943A]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">
                  Instructor Name
                </label>
                <input
                  value={sessionForm.instructor}
                  onChange={(e) => setSessionForm({ ...sessionForm, instructor: e.target.value })}
                  placeholder="Prof. Alan Turing"
                  className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-3.5 py-2.5 text-sm text-[#F0E2C8] focus:outline-none focus:border-[#E8943A]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">
                    Schedule Time
                  </label>
                  <input
                    value={sessionForm.time}
                    onChange={(e) => setSessionForm({ ...sessionForm, time: e.target.value })}
                    placeholder="10:00 – 11:30"
                    className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#F0E2C8] focus:outline-none focus:border-[#E8943A]"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">
                    Room / Hall
                  </label>
                  <input
                    value={sessionForm.room}
                    onChange={(e) => setSessionForm({ ...sessionForm, room: e.target.value })}
                    placeholder="Lab 3B"
                    className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-3.5 py-2.5 text-sm text-[#F0E2C8] focus:outline-none focus:border-[#E8943A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">
                  Session Lifecycle Status
                </label>
                <select
                  value={sessionForm.status || "upcoming"}
                  onChange={(e) => setSessionForm({ ...sessionForm, status: e.target.value as "upcoming" | "active" | "completed" })}
                  className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-3.5 py-2.5 text-sm text-[#F0E2C8] focus:outline-none focus:border-[#E8943A]"
                >
                  <option value="upcoming" className="bg-[#140E07] text-amber-400">UPCOMING</option>
                  <option value="active" className="bg-[#140E07] text-emerald-400">LIVE ACTIVE</option>
                  <option value="completed" className="bg-[#140E07] text-[#A89070]">COMPLETED / ARCHIVED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">
                  Assign Students to Session ({sessionForm.enrolledStudentIds?.length || 0} selected)
                </label>
                <div className="max-h-36 overflow-y-auto bg-[#140E07] border border-[#2A1F13] rounded-xl p-2.5 space-y-1.5">
                  {students.map((st) => {
                    const isChecked = sessionForm.enrolledStudentIds?.includes(st.id) || false;
                    return (
                      <label key={st.id} className="flex items-center gap-2.5 text-xs text-[#F0E2C8] cursor-pointer hover:bg-[#1E1610] p-1 rounded">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = sessionForm.enrolledStudentIds || [];
                            const updated = e.target.checked
                              ? [...current, st.id]
                              : current.filter((id) => id !== st.id);
                            setSessionForm({ ...sessionForm, enrolledStudentIds: updated, enrolled: updated.length });
                          }}
                          className="accent-[#C4622D]"
                        />
                        <span>{st.name}</span>
                        <span className="text-[#A89070] font-mono text-[10px] ml-auto">{st.studentId || st.id}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSessionModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#2A1F13] text-[#A89070] hover:text-[#F0E2C8] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold shadow-md"
                >
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT MODAL */}
      {studentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#1E1610] border border-[#2A1F13] rounded-2xl p-6 shadow-2xl animate-fade-in-up">
            <h3 className="font-serif text-xl text-[#F0E2C8] mb-4">
              {editingStudent ? "Edit Student Profile" : "Register Student Profile"}
            </h3>
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">
                  Full Name
                </label>
                <input
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  placeholder="e.g. Marcus Chen"
                  className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-3.5 py-2.5 text-sm text-[#F0E2C8] focus:outline-none focus:border-[#E8943A]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">
                  Student / Roll ID
                </label>
                <input
                  value={studentForm.studentId}
                  onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                  placeholder="STU-2026-042"
                  className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#F0E2C8] focus:outline-none focus:border-[#E8943A]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">
                    Department
                  </label>
                  <select
                    value={studentForm.department}
                    onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                    className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-3 py-2.5 text-sm text-[#F0E2C8] focus:outline-none focus:border-[#E8943A]"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d} className="bg-[#140E07]">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">
                    Year
                  </label>
                  <select
                    value={studentForm.year}
                    onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
                    className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-3 py-2.5 text-sm text-[#F0E2C8] focus:outline-none focus:border-[#E8943A]"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y} className="bg-[#140E07]">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStudentModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#2A1F13] text-[#A89070] hover:text-[#F0E2C8] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold shadow-md"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ATTENDANCE MANUAL MODAL */}
      {attendanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#1E1610] border border-[#2A1F13] rounded-2xl p-6 shadow-2xl animate-fade-in-up">
            <h3 className="font-serif text-xl text-[#F0E2C8] mb-4">Add Manual Attendance Entry</h3>
            <form onSubmit={handleAttendanceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">
                  Select Student
                </label>
                <select
                  value={attendanceForm.studentId}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, studentId: e.target.value })}
                  className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-3.5 py-2.5 text-sm text-[#F0E2C8] focus:outline-none focus:border-[#E8943A]"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#140E07]">
                      {s.name} ({s.studentId || s.id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">
                    Date
                  </label>
                  <input
                    type="date"
                    value={attendanceForm.date}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                    className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-3 py-2.5 text-sm font-mono text-[#F0E2C8] focus:outline-none focus:border-[#E8943A]"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">
                    Check-In Time
                  </label>
                  <input
                    value={attendanceForm.checkIn || ""}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, checkIn: e.target.value })}
                    placeholder="08:15:00"
                    className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-3 py-2.5 text-sm font-mono text-[#F0E2C8] focus:outline-none focus:border-[#E8943A]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">
                  Attendance Status
                </label>
                <select
                  value={attendanceForm.status}
                  onChange={(e) =>
                    setAttendanceForm({ ...attendanceForm, status: e.target.value as "present" | "late" | "absent" })
                  }
                  className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-3.5 py-2.5 text-sm text-[#F0E2C8] focus:outline-none focus:border-[#E8943A]"
                >
                  <option value="present" className="bg-[#140E07] text-emerald-400">
                    PRESENT
                  </option>
                  <option value="late" className="bg-[#140E07] text-amber-400">
                    LATE
                  </option>
                  <option value="absent" className="bg-[#140E07] text-rose-400">
                    ABSENT
                  </option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAttendanceModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#2A1F13] text-[#A89070] hover:text-[#F0E2C8] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold shadow-md"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
