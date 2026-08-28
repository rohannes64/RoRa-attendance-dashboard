import React, { useState } from "react";
import StatusBadge from "../common/StatusBadge";

export default function AdminConsole({
  sessions = [],
  students = [],
  attendanceRecords = [],
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
}) {
  const [activeTab, setActiveTab] = useState("sessions");

  // Modal States
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const [sessionForm, setSessionForm] = useState({
    id: "",
    subject: "",
    code: "",
    instructor: "",
    time: "09:00 – 10:30",
    room: "Room 101",
    enrolled: 30,
    present: 0,
    color: "#C4622D",
    status: "upcoming",
    enrolledStudentIds: [],
  });

  const [studentForm, setStudentForm] = useState({
    id: "",
    name: "",
    studentId: "",
    department: "Computer Science",
    year: "Year 3",
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
      status: "upcoming",
      enrolledStudentIds: [],
    });
    setSessionModalOpen(true);
  };

  const openEditSessionModal = (s) => {
    setEditingSession(s);
    setSessionForm({ ...s, enrolledStudentIds: s.enrolledStudentIds || [] });
    setSessionModalOpen(true);
  };

  const handleSessionSubmit = (e) => {
    e.preventDefault();
    if (!sessionForm.subject || !sessionForm.code) return;
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
      studentId: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
      department: "Computer Science",
      year: "Year 3",
    });
    setStudentModalOpen(true);
  };

  const openEditStudentModal = (st) => {
    setEditingStudent(st);
    setStudentForm({ ...st });
    setStudentModalOpen(true);
  };

  const handleStudentSubmit = (e) => {
    e.preventDefault();
    if (!studentForm.name) return;
    const initials = studentForm.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    const payload = {
      ...studentForm,
      avatar: initials || "ST",
      enrolledDate: studentForm.enrolledDate || new Date().toISOString().slice(0, 10),
    };
    if (editingStudent) {
      onUpdateStudent(payload);
    } else {
      onSaveStudent(payload);
    }
    setStudentModalOpen(false);
  };

  return (
    <div className="min-h-full bg-[#140E07] text-[#F0E2C8]">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-[#140E07]/90 backdrop-blur border-b border-[#2A1F13]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-[#A89070] hover:text-[#E8943A] transition-colors text-sm font-medium"
            >
              ← Back to Main App
            </button>
            <div className="w-px h-5 bg-[#2A1F13]" />
            <h1 className="font-serif text-lg text-[#F0E2C8]">FaceAttend Admin Control Console</h1>
          </div>

          <div className="flex gap-1 bg-[#1E1610] rounded-xl p-1 border border-[#2A1F13]">
            {[
              { id: "sessions", label: `Sessions (${sessions.length})` },
              { id: "students", label: `Students (${students.length})` },
              { id: "attendance", label: `Ledger (${attendanceRecords.length})` },
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
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Telemetry Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-[#2A1F13] bg-[#1E1610] p-5">
            <div className="text-xs uppercase text-[#A89070] mb-1 font-mono">Total Class Sessions</div>
            <div className="font-serif text-3xl text-[#E8943A]">{sessions.length}</div>
          </div>
          <div className="rounded-xl border border-[#2A1F13] bg-[#1E1610] p-5">
            <div className="text-xs uppercase text-[#A89070] mb-1 font-mono">Enrolled Students</div>
            <div className="font-serif text-3xl text-[#E8943A]">{students.length}</div>
          </div>
          <div className="rounded-xl border border-[#2A1F13] bg-[#1E1610] p-5">
            <div className="text-xs uppercase text-[#A89070] mb-1 font-mono">Attendance Records</div>
            <div className="font-serif text-3xl text-[#E8943A]">{attendanceRecords.length}</div>
          </div>
        </div>

        {/* Tab 1: Sessions Management */}
        {activeTab === "sessions" && (
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-xl text-[#F0E2C8]">Course Sessions Manager</h2>
                <p className="text-xs text-[#A89070]">Create, edit, or delete scheduled class sessions</p>
              </div>
              <button
                onClick={openNewSessionModal}
                className="px-4 py-2 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold shadow-md"
              >
                + Add New Session
              </button>
            </div>

            <div className="rounded-xl border border-[#2A1F13] overflow-hidden bg-[#1E1610]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#18110B] border-b border-[#2A1F13] text-[#A89070] text-xs font-semibold uppercase">
                    <th className="text-left px-5 py-3.5">Code</th>
                    <th className="text-left px-5 py-3.5">Subject</th>
                    <th className="text-left px-5 py-3.5">Instructor</th>
                    <th className="text-left px-5 py-3.5">Schedule</th>
                    <th className="text-left px-5 py-3.5">Status</th>
                    <th className="text-right px-5 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id || s.sessionId} className="border-b border-[#2A1F13] last:border-0 hover:bg-[#251C15]">
                      <td className="px-5 py-4 font-mono text-xs text-[#C4622D] font-bold">{s.code}</td>
                      <td className="px-5 py-4 font-medium text-[#F0E2C8]">{s.subject}</td>
                      <td className="px-5 py-4 text-xs text-[#A89070]">{s.instructor}</td>
                      <td className="px-5 py-4 text-xs text-[#A89070] font-mono">{s.time} • {s.room}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.status === "active" ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40" : s.status === "completed" ? "bg-[#140E07] text-[#A89070] border border-[#2A1F13]" : "bg-amber-950 text-amber-400 border border-amber-500/40"}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEditSessionModal(s)}
                          className="px-2.5 py-1 rounded-lg border border-[#2A1F13] text-[#E8943A] hover:bg-[#2A1F13] text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteSession(s.id || s.sessionId)}
                          className="px-2.5 py-1 rounded-lg border border-rose-900/50 bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Students Management */}
        {activeTab === "students" && (
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-xl text-[#F0E2C8]">Enrolled Students Directory</h2>
                <p className="text-xs text-[#A89070]">Manage registered biometric student profiles</p>
              </div>
              <button
                onClick={openNewStudentModal}
                className="px-4 py-2 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold shadow-md"
              >
                + Register New Student
              </button>
            </div>

            <div className="rounded-xl border border-[#2A1F13] overflow-hidden bg-[#1E1610]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#18110B] border-b border-[#2A1F13] text-[#A89070] text-xs font-semibold uppercase">
                    <th className="text-left px-5 py-3.5">Student Name</th>
                    <th className="text-left px-5 py-3.5">Roll ID</th>
                    <th className="text-left px-5 py-3.5">Department</th>
                    <th className="text-left px-5 py-3.5">Biometrics</th>
                    <th className="text-right px-5 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((st) => (
                    <tr key={st.id || st.studentId} className="border-b border-[#2A1F13] last:border-0 hover:bg-[#251C15]">
                      <td className="px-5 py-4 font-medium text-[#F0E2C8]">{st.name}</td>
                      <td className="px-5 py-4 font-mono text-xs text-[#A89070]">{st.studentId || st.id}</td>
                      <td className="px-5 py-4 text-xs text-[#A89070]">{st.department || "Computer Science"}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${st.descriptor ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30" : "bg-[#140E07] text-[#A89070] border border-[#2A1F13]"}`}>
                          {st.descriptor ? "128D VECTOR OK" : "DEFAULT SEED"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEditStudentModal(st)}
                          className="px-2.5 py-1 rounded-lg border border-[#2A1F13] text-[#E8943A] hover:bg-[#2A1F13] text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteStudent(st.id || st.studentId)}
                          className="px-2.5 py-1 rounded-lg border border-rose-900/50 bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Master Attendance Ledger */}
        {activeTab === "attendance" && (
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-xl text-[#F0E2C8]">Master Attendance Ledger</h2>
                <p className="text-xs text-[#A89070]">System-wide historical check-in and check-out logs</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#2A1F13] overflow-hidden bg-[#1E1610]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#18110B] border-b border-[#2A1F13] text-[#A89070] text-xs font-semibold uppercase">
                    <th className="text-left px-5 py-3.5">Student ID</th>
                    <th className="text-left px-5 py-3.5">Session ID</th>
                    <th className="text-left px-5 py-3.5">Check-In</th>
                    <th className="text-left px-5 py-3.5">Status</th>
                    <th className="text-right px-5 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#A89070] text-xs">No records in ledger yet.</td>
                    </tr>
                  ) : (
                    attendanceRecords.map((r) => (
                      <tr key={r.id || r.recordId} className="border-b border-[#2A1F13] last:border-0 hover:bg-[#251C15]">
                        <td className="px-5 py-4 font-mono text-xs text-[#F0E2C8]">{r.studentId}</td>
                        <td className="px-5 py-4 font-mono text-xs text-[#A89070]">{r.sessionId || "Global"}</td>
                        <td className="px-5 py-4 font-mono text-xs text-[#A89070]">{r.checkIn || "—"}</td>
                        <td className="px-5 py-4">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => onDeleteAttendance(r.id || r.recordId)}
                            className="px-2.5 py-1 rounded-lg border border-rose-900/50 bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 text-xs"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* SESSION EDIT MODAL */}
      {sessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#1E1610] border border-[#2A1F13] rounded-2xl p-6 shadow-2xl animate-fade-in-up max-h-[85vh] flex flex-col">
            <h3 className="font-serif text-xl text-[#F0E2C8] mb-4">
              {editingSession ? "Edit Class Session" : "Create New Class Session"}
            </h3>
            <form onSubmit={handleSessionSubmit} className="space-y-4 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">Course Subject</label>
                <input
                  value={sessionForm.subject}
                  onChange={(e) => setSessionForm({ ...sessionForm, subject: e.target.value })}
                  className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-3.5 py-2.5 text-sm text-[#F0E2C8] focus:outline-none focus:border-[#E8943A]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">Course Code</label>
                  <input
                    value={sessionForm.code}
                    onChange={(e) => setSessionForm({ ...sessionForm, code: e.target.value })}
                    className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#F0E2C8] focus:outline-none focus:border-[#E8943A]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">Instructor</label>
                  <input
                    value={sessionForm.instructor}
                    onChange={(e) => setSessionForm({ ...sessionForm, instructor: e.target.value })}
                    className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-3.5 py-2.5 text-sm text-[#F0E2C8] focus:outline-none focus:border-[#E8943A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">Assign Students ({sessionForm.enrolledStudentIds?.length || 0} selected)</label>
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
                            const updated = e.target.checked ? [...current, st.id] : current.filter((id) => id !== st.id);
                            setSessionForm({ ...sessionForm, enrolledStudentIds: updated, enrolled: updated.length });
                          }}
                          className="accent-[#C4622D]"
                        />
                        <span>{st.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSessionModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#2A1F13] text-[#A89070] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold"
                >
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT EDIT MODAL */}
      {studentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#1E1610] border border-[#2A1F13] rounded-2xl p-6 shadow-2xl animate-fade-in-up">
            <h3 className="font-serif text-xl text-[#F0E2C8] mb-4">
              {editingStudent ? "Edit Student Profile" : "Register New Student"}
            </h3>
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">Student Name</label>
                <input
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-3.5 py-2.5 text-sm text-[#F0E2C8] focus:outline-none focus:border-[#E8943A]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">Student Roll ID</label>
                <input
                  value={studentForm.studentId}
                  onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                  className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#F0E2C8] focus:outline-none focus:border-[#E8943A]"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStudentModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#2A1F13] text-[#A89070] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
