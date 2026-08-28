'use client';

import React, { useState, useMemo } from "react";
import { STUDENTS, ATTENDANCE, DEPARTMENTS } from "../../data/figmaData";
import type { Student, AttendanceRecord } from "../../data/figmaData";

const TEAL = "#26d0ce";

function avatarColor(initials: string) {
  const hues = [200, 175, 220, 190, 210, 185, 230, 170, 195, 215, 178, 205];
  return `hsl(${hues[initials.charCodeAt(0) % hues.length]}, 55%, 38%)`;
}

const DATES = ["2026-08-28", "2026-08-27", "2026-08-26", "2026-08-25", "2026-08-22"];
function fmtDate(d: string) {
  const date = new Date(d + "T00:00:00");
  const today = new Date("2026-08-28");
  const yesterday = new Date("2026-08-27");
  if (d === today.toISOString().slice(0, 10)) return "Today";
  if (d === yesterday.toISOString().slice(0, 10)) return "Yesterday";
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function duration(checkIn: string | null, checkOut: string | null) {
  if (!checkIn || !checkOut) return "—";
  const [h1, m1] = checkIn.split(":").map(Number);
  const [h2, m2] = checkOut.split(":").map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return "—";
  let mins = h2 * 60 + m2 - (h1 * 60 + m1);
  if (mins < 0) mins += 24 * 60;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

interface Props {
  students?: Student[];
  attendanceRecords?: AttendanceRecord[];
  extraStudents?: Student[];
}

export default function AttendancePage({ students, attendanceRecords, extraStudents = [] }: Props) {
  const [selectedDate, setSelectedDate] = useState(DATES[0]);
  const [dept, setDept] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const allStudents = useMemo(() => {
    if (students && students.length > 0) return students;
    return [...STUDENTS, ...extraStudents];
  }, [students, extraStudents]);

  const allRecords = useMemo(() => {
    if (attendanceRecords && attendanceRecords.length > 0) return attendanceRecords;
    return ATTENDANCE;
  }, [attendanceRecords]);

  const dayRecords = useMemo(
    () => allRecords.filter((r) => r.date === selectedDate),
    [allRecords, selectedDate]
  );

  const filtered = useMemo(() => {
    return allStudents.filter((s) => {
      const matchDept = dept === "All" || s.department === dept;
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.studentId.toLowerCase().includes(search.toLowerCase());
      return matchDept && matchSearch;
    });
  }, [allStudents, dept, search]);

  const stats = useMemo(() => {
    const present = dayRecords.filter((r) => r.status === "present").length;
    const late = dayRecords.filter((r) => r.status === "late").length;
    const totalEnrolled = allStudents.length;
    const recordedAbsents = dayRecords.filter((r) => r.status === "absent").length;
    const unrecordedExtra = Math.max(0, totalEnrolled - dayRecords.length);
    const absent = recordedAbsents + unrecordedExtra;
    const rate =
      totalEnrolled > 0
        ? Math.round(((present + late) / totalEnrolled) * 100)
        : 0;
    return { present, late, absent, rate };
  }, [dayRecords, allStudents]);

  // Weekly history for selected student
  const studentHistory = useMemo(() => {
    if (!selectedStudent) return [];
    return DATES.map((d) => {
      const rec = allRecords.find((r) => r.studentId === selectedStudent && r.date === d);
      return { date: d, rec };
    });
  }, [allRecords, selectedStudent]);

  const selectedStudentData = allStudents.find((s) => s.id === selectedStudent);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="px-8 py-5 shrink-0" style={{ borderBottom: "1px solid rgba(38,208,206,0.1)" }}>
        <div
          style={{
            fontSize: 10,
            color: TEAL,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          Attendance Records
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h1
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 28,
              fontWeight: 400,
              color: "#f0f6ff",
              lineHeight: 1,
            }}
          >
            Student Attendance
          </h1>
          {/* Date tabs */}
          <div className="flex items-center gap-1">
            {DATES.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className="px-3 py-1.5 rounded-lg text-xs transition-all duration-150"
                style={{
                  background: selectedDate === d ? TEAL : "rgba(240,246,255,0.05)",
                  color: selectedDate === d ? "#0d1b3e" : "rgba(240,246,255,0.5)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: selectedDate === d ? 600 : 400,
                }}
              >
                {fmtDate(d)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 mt-5">
          {[
            { label: "Present", val: stats.present, color: TEAL },
            { label: "Late", val: stats.late, color: "#facc15" },
            { label: "Absent", val: stats.absent, color: "#f87171" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
              <span style={{ color: s.color, fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 600 }}>
                {s.val}
              </span>
              <span style={{ color: "rgba(240,246,255,0.4)", fontSize: 12 }}>{s.label}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 22,
                color: stats.rate >= 80 ? TEAL : "#facc15",
                fontWeight: 600,
              }}
            >
              {stats.rate}%
            </div>
            <div style={{ fontSize: 11, color: "rgba(240,246,255,0.4)" }}>attendance rate</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className="flex items-center gap-3 px-8 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(38,208,206,0.06)" }}
      >
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "rgba(240,246,255,0.3)" }}>
            ⌕
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or ID…"
            className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none"
            style={{
              background: "rgba(240,246,255,0.05)",
              border: "1px solid rgba(38,208,206,0.15)",
              color: "#f0f6ff",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
        </div>
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{
            background: "rgba(240,246,255,0.05)",
            border: "1px solid rgba(38,208,206,0.15)",
            color: "rgba(240,246,255,0.7)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <option value="All">All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <div
          style={{
            marginLeft: "auto",
            fontSize: 12,
            color: "rgba(240,246,255,0.3)",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {filtered.length} student{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: "rgba(13,27,62,0.8)" }}>
                {["Student", "Dept / Year", "Check In", "Check Out", "Duration", "Status"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-6 py-3"
                    style={{
                      color: "rgba(240,246,255,0.4)",
                      fontWeight: 500,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontFamily: "'JetBrains Mono', monospace",
                      borderBottom: "1px solid rgba(38,208,206,0.1)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => {
                const rec = dayRecords.find((r) => r.studentId === student.id);
                const status = rec?.status ?? "absent";
                const isSelected = selectedStudent === student.id;
                return (
                  <tr
                    key={student.id}
                    onClick={() => setSelectedStudent(isSelected ? null : student.id)}
                    className="cursor-pointer transition-colors duration-150"
                    style={{
                      background: isSelected ? "rgba(38,208,206,0.06)" : "transparent",
                      borderBottom: "1px solid rgba(240,246,255,0.04)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLElement).style.background = "rgba(240,246,255,0.02)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                          style={{ background: avatarColor(student.avatar), color: "#fff" }}
                        >
                          {student.avatar}
                        </div>
                        <div>
                          <div style={{ color: "#f0f6ff", fontWeight: 500 }}>{student.name}</div>
                          <div style={{ color: "rgba(240,246,255,0.35)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                            {student.studentId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div style={{ color: "rgba(240,246,255,0.7)" }}>{student.department}</div>
                      <div style={{ color: "rgba(240,246,255,0.35)", fontSize: 11 }}>{student.year}</div>
                    </td>
                    <td className="px-6 py-3" style={{ fontFamily: "'JetBrains Mono', monospace", color: rec?.checkIn ? "#f0f6ff" : "rgba(240,246,255,0.2)" }}>
                      {rec?.checkIn ?? "—"}
                    </td>
                    <td className="px-6 py-3" style={{ fontFamily: "'JetBrains Mono', monospace", color: rec?.checkOut ? "#f0f6ff" : "rgba(240,246,255,0.2)" }}>
                      {rec?.checkOut ?? "—"}
                    </td>
                    <td className="px-6 py-3" style={{ fontFamily: "'JetBrains Mono', monospace", color: "rgba(240,246,255,0.6)" }}>
                      {duration(rec?.checkIn ?? null, rec?.checkOut ?? null)}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: status === "present" ? "rgba(38,208,206,0.1)" : status === "late" ? "rgba(250,204,21,0.1)" : "rgba(248,113,113,0.1)",
                          color: status === "present" ? TEAL : status === "late" ? "#facc15" : "#f87171",
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 10,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Side panel: weekly history */}
        {selectedStudent && selectedStudentData && (
          <div
            className="shrink-0 overflow-y-auto"
            style={{ width: 280, background: "rgba(10,18,42,0.97)", borderLeft: "1px solid rgba(38,208,206,0.1)" }}
          >
            <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(38,208,206,0.1)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
                  style={{ background: avatarColor(selectedStudentData.avatar), color: "#fff" }}
                >
                  {selectedStudentData.avatar}
                </div>
                <div>
                  <div style={{ color: "#f0f6ff", fontWeight: 600, fontSize: 14 }}>{selectedStudentData.name}</div>
                  <div style={{ color: "rgba(240,246,255,0.4)", fontSize: 11 }}>{selectedStudentData.studentId}</div>
                </div>
              </div>
              <div style={{ color: "rgba(240,246,255,0.5)", fontSize: 12 }}>
                {selectedStudentData.department} · {selectedStudentData.year}
              </div>
            </div>
            <div className="px-5 py-4">
              <div
                style={{
                  fontSize: 10,
                  color: TEAL,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Weekly History
              </div>
              <div className="flex flex-col gap-3">
                {studentHistory.map(({ date, rec }) => (
                  <div key={date} className="flex items-center justify-between">
                    <div style={{ fontSize: 12, color: "rgba(240,246,255,0.5)" }}>{fmtDate(date)}</div>
                    <div className="flex items-center gap-2">
                      {rec?.checkIn && (
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(240,246,255,0.6)" }}>
                          {rec.checkIn}
                        </span>
                      )}
                      <span
                        className="px-2 py-0.5 rounded text-xs"
                        style={{
                          background: !rec || rec.status === "absent" ? "rgba(248,113,113,0.1)" : rec.status === "late" ? "rgba(250,204,21,0.1)" : "rgba(38,208,206,0.1)",
                          color: !rec || rec.status === "absent" ? "#f87171" : rec.status === "late" ? "#facc15" : TEAL,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 9,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                        }}
                      >
                        {rec?.status ?? "absent"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Attendance rate for this student */}
              <div className="mt-6 pt-4" style={{ borderTop: "1px solid rgba(38,208,206,0.1)" }}>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(240,246,255,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 6,
                  }}
                >
                  5-day rate
                </div>
                {(() => {
                  const attended = studentHistory.filter((h) => h.rec && h.rec.status !== "absent").length;
                  const pct = Math.round((attended / DATES.length) * 100);
                  return (
                    <>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: pct >= 80 ? TEAL : "#facc15" }}>
                        {pct}%
                      </div>
                      <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(240,246,255,0.08)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: pct >= 80 ? TEAL : "#facc15" }}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
