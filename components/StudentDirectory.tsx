'use client';

import React, { useState } from 'react';
import {
  Search,
  UserPlus,
  Grid,
  List,
  Mail,
  GraduationCap,
  Trash2,
  CheckCircle2,
  Fingerprint,
  X,
} from 'lucide-react';
import type { StudentProfile } from '../types/attendance';

interface StudentDirectoryProps {
  students: StudentProfile[];
  onOpenEnrollment: () => void;
  onDeleteStudent: (studentId: string) => void;
}

export const StudentDirectory: React.FC<StudentDirectoryProps> = ({
  students,
  onOpenEnrollment,
  onDeleteStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [selectedVectorStudent, setSelectedVectorStudent] = useState<StudentProfile | null>(null);

  const branches = [
    { id: 'ALL', label: 'All Departments' },
    { id: 'Computer Science', label: 'CS & AI' },
    { id: 'Artificial Intelligence', label: 'AI & Data Science' },
    { id: 'Electronics', label: 'Electronics & VLSI' },
    { id: 'Information Technology', label: 'IT' },
    { id: 'Mechanical', label: 'Mechanical' },
    { id: 'Electrical', label: 'Electrical' },
  ];

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.branch.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBranch = selectedBranch === 'ALL' || s.branch.toLowerCase().includes(selectedBranch.toLowerCase());

    return matchesSearch && matchesBranch;
  });

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="product-card p-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search students by name, roll no, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md bg-[#090d14] border border-[#1e2a42] pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3b82f6] transition-colors"
          />
        </div>

        {/* View Switcher & Action */}
        <div className="flex items-center gap-2">
          <div className="flex rounded bg-[#090d14] p-0.5 border border-[#1b273d]">
            <button
              onClick={() => setViewMode('GRID')}
              title="Grid View"
              className={`p-1 rounded transition-all ${
                viewMode === 'GRID' ? 'bg-[#182338] text-white border border-[#283754]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              title="Table View"
              className={`p-1 rounded transition-all ${
                viewMode === 'TABLE' ? 'bg-[#182338] text-white border border-[#283754]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

          <button onClick={onOpenEnrollment} className="btn-primary">
            <UserPlus className="h-3.5 w-3.5" />
            <span>Enroll Student</span>
          </button>
        </div>

        {/* Department Filter Pills */}
        <div className="w-full flex overflow-x-auto gap-1 pt-2 border-t border-[#162033] no-scrollbar">
          {branches.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBranch(b.id)}
              className={`rounded px-2.5 py-1 text-xs font-mono whitespace-nowrap transition-all ${
                selectedBranch === b.id
                  ? 'bg-[#182338] text-emerald-300 border border-[#283754] font-medium'
                  : 'bg-[#090d14] text-slate-400 border border-[#182236] hover:text-slate-200'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'GRID' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredStudents.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-500 text-xs">
              No students found matching your search.
            </div>
          ) : (
            filteredStudents.map((student) => {
              const attendanceRate =
                student.totalSessions > 0
                  ? Math.round((student.attendedSessions / student.totalSessions) * 100)
                  : 95;

              return (
                <div
                  key={student.id}
                  className="product-card p-3.5 flex flex-col justify-between relative group hover:border-[#2b3c5e] transition-colors"
                >
                  <button
                    onClick={() => onDeleteStudent(student.id)}
                    title="Remove Student"
                    className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-[#1f141b] transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <div>
                    {/* Top: Avatar & Info */}
                    <div className="flex items-start gap-2.5 mb-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={student.avatarUrl}
                        alt={student.name}
                        className="h-10 w-10 rounded object-cover border border-[#1e2a42] shrink-0"
                      />

                      <div className="min-w-0 flex-1 pr-3">
                        <span className="text-[10.5px] font-mono text-emerald-400 block font-medium">
                          {student.rollNo}
                        </span>
                        <h4 className="text-xs font-semibold text-white truncate">
                          {student.name}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono block truncate">
                          Sem {student.semester} ({student.section})
                        </span>
                      </div>
                    </div>

                    {/* Department & Email */}
                    <div className="space-y-1 text-xs text-slate-300 mb-3">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <GraduationCap className="h-3 w-3 text-slate-500 shrink-0" />
                        <span className="truncate">{student.branch}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[10.5px]">
                        <Mail className="h-3 w-3 text-slate-600 shrink-0" />
                        <span className="truncate">{student.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance & Biometric Descriptor Trigger */}
                  <div className="pt-2 border-t border-[#182338] space-y-1.5">
                    <div className="flex items-center justify-between text-[10.5px] font-mono">
                      <span className="text-slate-500">Attendance:</span>
                      <span
                        className={`font-semibold tabular-nums ${
                          attendanceRate >= 85
                            ? 'text-emerald-400'
                            : attendanceRate >= 75
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {attendanceRate}%
                      </span>
                    </div>

                    <div className="h-1 w-full rounded-full bg-[#090d14] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${attendanceRate}%` }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedVectorStudent(student)}
                      className="w-full mt-1.5 flex items-center justify-center gap-1 rounded bg-[#090d14] border border-[#1a2338] py-1 text-[10px] font-mono text-slate-400 hover:text-slate-200 hover:border-[#283754] transition-colors"
                    >
                      <Fingerprint className="h-3 w-3 text-slate-400" />
                      <span>128-D Embedding</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table View */
        <div className="product-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b101c] border-b border-[#1b273d] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5 font-medium">Student</th>
                <th className="py-2.5 px-3.5 font-medium">Roll Number</th>
                <th className="py-2.5 px-3.5 font-medium">Department</th>
                <th className="py-2.5 px-3.5 font-medium">Sem / Sec</th>
                <th className="py-2.5 px-3.5 font-medium">Attendance</th>
                <th className="py-2.5 px-3.5 font-medium">Biometrics</th>
                <th className="py-2.5 px-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#162033]">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-[#121929] transition-colors">
                  <td className="py-2.5 px-3.5">
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={student.avatarUrl}
                        alt={student.name}
                        className="h-7 w-7 rounded object-cover border border-[#1e2a42]"
                      />
                      <div>
                        <span className="font-medium text-white text-xs block">{student.name}</span>
                        <span className="text-[10.5px] font-mono text-slate-500">{student.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-emerald-400 font-medium">{student.rollNo}</td>
                  <td className="py-2.5 px-3.5 text-slate-300">{student.branch}</td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-400">
                    Sem {student.semester} ({student.section})
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-emerald-400 font-semibold tabular-nums">
                    {student.totalSessions > 0
                      ? Math.round((student.attendedSessions / student.totalSessions) * 100)
                      : 95}%
                  </td>
                  <td className="py-2.5 px-3.5">
                    <button
                      onClick={() => setSelectedVectorStudent(student)}
                      className="tag-neutral text-[10.5px]"
                    >
                      <Fingerprint className="h-3 w-3" />
                      128D Verified
                    </button>
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <button
                      onClick={() => onDeleteStudent(student.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 128D Vector Inspector Dialog */}
      {selectedVectorStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in duration-150">
          <div className="product-card w-full max-w-lg p-5 shadow-dropdown space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#1e2a42]">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-emerald-400" />
                <div>
                  <h3 className="text-xs font-semibold text-white font-sans">
                    128-D Biometric Embedding Vector
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    {selectedVectorStudent.name} ({selectedVectorStudent.rollNo})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVectorStudent(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Normalized mathematical feature vector generated on the client via FaceNet Inception-ResNet.
            </p>

            <div className="h-40 overflow-y-auto rounded bg-[#060910] border border-[#182338] p-2.5 font-mono text-[10.5px] text-emerald-400 leading-relaxed tabular-nums">
              [
              {selectedVectorStudent.descriptor.map((val, idx) => (
                <span key={idx} className="hover:text-white px-0.5">
                  {val >= 0 ? `+${val.toFixed(5)}` : val.toFixed(5)}
                  {idx < selectedVectorStudent.descriptor.length - 1 ? ', ' : ''}
                  {(idx + 1) % 6 === 0 ? '\n' : ''}
                </span>
              ))}
              ]
            </div>

            <div className="flex items-center justify-between pt-2 text-xs font-mono text-slate-500">
              <span>Length: 128 (L2 Normalized)</span>
              <button
                onClick={() => setSelectedVectorStudent(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
