'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import type { AttendanceRecord, StudentProfile } from '../types/attendance';
import { ExportModal } from './ExportModal';

interface LiveSessionLogProps {
  enrolledStudents: StudentProfile[];
  attendanceRecords: AttendanceRecord[];
  activeCourse: string;
  activeSection: string;
  onUpdateStatus: (studentId: string, status: 'PRESENT' | 'LATE' | 'ABSENT') => void;
  onDeleteRecord: (recordId: string) => void;
}

export const LiveSessionLog: React.FC<LiveSessionLogProps> = ({
  enrolledStudents,
  attendanceRecords,
  activeCourse,
  activeSection,
  onUpdateStatus,
  onDeleteRecord,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'LATE' | 'ABSENT'>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [isExportOpen, setIsExportOpen] = useState(false);

  const rosterWithStatus = enrolledStudents.map((student) => {
    const record = attendanceRecords.find(
      (r) => r.studentId === student.id || r.rollNo === student.rollNo
    );
    return {
      student,
      record,
      status: record ? record.status : 'ABSENT',
      confidence: record ? record.confidence : 0,
      distance: record ? record.distance : 1.0,
      livenessScore: record ? record.livenessScore : 0,
      timestamp: record ? record.timestamp : null,
      recordId: record ? record.id : null,
    };
  });

  const filteredRoster = rosterWithStatus.filter((item) => {
    const matchesSearch =
      item.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.student.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PRESENT' && item.status === 'PRESENT') ||
      (statusFilter === 'LATE' && item.status === 'LATE') ||
      (statusFilter === 'ABSENT' && item.status === 'ABSENT');

    const matchesBranch =
      branchFilter === 'ALL' || item.student.branch.toLowerCase().includes(branchFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesBranch;
  });

  const totalEnrolled = enrolledStudents.length;
  const presentCount = rosterWithStatus.filter((r) => r.status === 'PRESENT').length;
  const lateCount = rosterWithStatus.filter((r) => r.status === 'LATE').length;
  const absentCount = totalEnrolled - presentCount - lateCount;
  const attendanceRate = totalEnrolled > 0 ? Math.round(((presentCount + lateCount) / totalEnrolled) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Session Metrics Bar */}
      <div className="product-card p-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[#1e2a42]">
          <div className="pt-2 sm:pt-0 sm:pr-4">
            <span className="text-[11px] font-mono text-slate-500 block">Enrolled Roster</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-white tabular-nums">{totalEnrolled}</span>
              <span className="text-[11px] text-slate-400 font-sans">students</span>
            </div>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-4">
            <span className="text-[11px] font-mono text-slate-500 block">Verified Present</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">{presentCount}</span>
              <span className="text-[11px] text-slate-400 font-sans">on time</span>
            </div>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-4">
            <span className="text-[11px] font-mono text-slate-500 block">Late Arrivals</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-amber-400 tabular-nums">{lateCount}</span>
              <span className="text-[11px] text-slate-400 font-sans">&gt; 15 mins</span>
            </div>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-4">
            <span className="text-[11px] font-mono text-slate-500 block">Unverified / Absent</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-rose-400 tabular-nums">{absentCount}</span>
              <span className="text-[11px] text-slate-400 font-sans">absent</span>
            </div>
          </div>

          <div className="pt-2 sm:pt-0 sm:pl-4 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-mono text-slate-500 block">Session Turnout</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-white tabular-nums">{attendanceRate}%</span>
              <span className="text-[11px] text-emerald-400 font-sans">rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters & Export */}
      <div className="product-card p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search student name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md bg-[#090d14] border border-[#1e2a42] pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3b82f6] transition-colors"
            />
          </div>

          {/* Status Segmented Filter */}
          <div className="flex rounded bg-[#090d14] p-0.5 border border-[#1b273d] text-xs font-mono">
            {(['ALL', 'PRESENT', 'LATE', 'ABSENT'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  statusFilter === st
                    ? 'bg-[#182338] text-white border border-[#283754]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Department Filter */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="rounded-md bg-[#090d14] border border-[#1e2a42] px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-[#3b82f6]"
          >
            <option value="ALL">All Departments</option>
            <option value="Computer Science">Computer Science & AI</option>
            <option value="Artificial Intelligence">AI & Data Science</option>
            <option value="Electronics">Electronics & VLSI</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Electrical">Electrical</option>
          </select>
        </div>

        {/* Export Button */}
        <button
          onClick={() => setIsExportOpen(true)}
          className="btn-secondary text-xs"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Dossier (PDF / CSV)</span>
        </button>
      </div>

      {/* Attendance Register Table */}
      <div className="product-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b101c] border-b border-[#1b273d] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5 font-medium">Student</th>
                <th className="py-2.5 px-3.5 font-medium">Roll Number</th>
                <th className="py-2.5 px-3.5 font-medium">Department</th>
                <th className="py-2.5 px-3.5 font-medium">Check-In Time</th>
                <th className="py-2.5 px-3.5 font-medium">Match Precision</th>
                <th className="py-2.5 px-3.5 font-medium">Status</th>
                <th className="py-2.5 px-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#162033]">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No students match the current filters.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((item) => {
                  const { student, status, confidence, distance, timestamp } = item;
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-[#121929] transition-colors"
                    >
                      {/* Student Info */}
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={student.avatarUrl}
                            alt={student.name}
                            className="h-7 w-7 rounded object-cover border border-[#1e2a42]"
                          />
                          <div>
                            <span className="font-medium text-white text-xs block">
                              {student.name}
                            </span>
                            <span className="text-[10.5px] text-slate-500 font-mono">{student.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Roll Number */}
                      <td className="py-2.5 px-3.5 font-mono text-slate-300">
                        {student.rollNo}
                      </td>

                      {/* Branch */}
                      <td className="py-2.5 px-3.5 text-slate-300">
                        <span>{student.branch}</span>
                        <span className="text-[10px] text-slate-500 block font-mono">
                          Sem {student.semester} ({student.section})
                        </span>
                      </td>

                      {/* Check-in Time */}
                      <td className="py-2.5 px-3.5 font-mono text-slate-300 tabular-nums">
                        {timestamp ? (
                          new Date(timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Match Telemetry */}
                      <td className="py-2.5 px-3.5 font-mono">
                        {status !== 'ABSENT' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="tag-present text-[10px] tabular-nums">
                              {confidence}%
                            </span>
                            <span className="text-[10px] text-slate-500 tabular-nums">d={distance.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Status Tag */}
                      <td className="py-2.5 px-3.5">
                        {status === 'PRESENT' && <span className="tag-present">PRESENT</span>}
                        {status === 'LATE' && <span className="tag-late">LATE</span>}
                        {status === 'ABSENT' && <span className="tag-absent">ABSENT</span>}
                      </td>

                      {/* Inline Override Actions */}
                      <td className="py-2.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="Mark Present"
                            onClick={() => onUpdateStatus(student.id, 'PRESENT')}
                            className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-[#131c2e] transition-colors"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title="Mark Late"
                            onClick={() => onUpdateStatus(student.id, 'LATE')}
                            className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-[#131c2e] transition-colors"
                          >
                            <Clock className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title="Mark Absent"
                            onClick={() => onUpdateStatus(student.id, 'ABSENT')}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-[#131c2e] transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        attendanceRecords={attendanceRecords}
        allStudents={enrolledStudents}
        courseCode={activeCourse}
        courseName={activeCourse}
        section={activeSection}
      />
    </div>
  );
};
