'use client';

import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, X, Check, Building2, Calendar, Clock, UserCheck } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AttendanceRecord, StudentProfile } from '../types/attendance';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceRecords: AttendanceRecord[];
  allStudents: StudentProfile[];
  courseCode: string;
  courseName: string;
  section: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  attendanceRecords,
  allStudents,
  courseCode,
  courseName,
  section,
}) => {
  const [instituteName, setInstituteName] = useState('Indian Institute of Technology / National Institute of Technology');
  const [departmentName, setDepartmentName] = useState('Department of Computer Science & Artificial Intelligence');
  const [instructorName, setInstructorName] = useState('Prof. K. Ramanujan, Ph.D.');
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!isOpen) return null;

  // Generate consolidated attendance list (including absentees)
  const consolidatedList = allStudents.map((student, idx) => {
    const record = attendanceRecords.find((r) => r.studentId === student.id || r.rollNo === student.rollNo);
    return {
      slNo: idx + 1,
      rollNo: student.rollNo,
      name: student.name,
      branch: student.branch,
      timeIn: record ? new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—',
      confidence: record ? `${record.confidence}%` : '—',
      liveness: record ? `${record.livenessScore}%` : '—',
      status: record ? record.status : 'ABSENT',
    };
  });

  // Export to CSV
  const exportCSV = () => {
    setDownloading('CSV');
    try {
      const headers = ['Sl No', 'Roll Number', 'Student Name', 'Branch', 'Time In', 'Confidence %', 'Liveness Score', 'Status'];
      const rows = consolidatedList.map((row) => [
        row.slNo,
        `"${row.rollNo}"`,
        `"${row.name}"`,
        `"${row.branch}"`,
        `"${row.timeIn}"`,
        `"${row.confidence}"`,
        `"${row.liveness}"`,
        `"${row.status}"`,
      ]);

      const csvContent = [
        `# ${instituteName}`,
        `# ${departmentName}`,
        `# Course: ${courseCode} - ${courseName} | Section: ${section}`,
        `# Date: ${new Date().toLocaleDateString('en-IN')} | Instructor: ${instructorName}`,
        headers.join(','),
        ...rows.map((r) => r.join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Drishti_Attendance_${courseCode.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setTimeout(() => setDownloading(null), 800);
    }
  };

  // Export to Official Printable PDF Report
  const exportPDF = () => {
    setDownloading('PDF');
    try {
      const doc = new jsPDF();

      // Top Institutional Header
      doc.setFillColor(15, 23, 42); // Deep slate
      doc.rect(0, 0, 210, 38, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(instituteName.toUpperCase(), 105, 12, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text(departmentName, 105, 18, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 211, 153);
      doc.text('OFFICIAL BIOMETRIC ATTENDANCE DOSSIER (DRISHTI AI)', 105, 26, { align: 'center' });

      // Session Metadata Box
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');

      const dateStr = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      doc.text(`Course: ${courseCode} - ${courseName}`, 14, 46);
      doc.text(`Section / Batch: ${section}`, 14, 52);
      doc.text(`Date: ${dateStr}`, 130, 46);
      doc.text(`Instructor: ${instructorName}`, 130, 52);

      const presentCount = consolidatedList.filter((s) => s.status === 'PRESENT').length;
      const totalStudents = consolidatedList.length;
      const rate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

      // Summary Metric Pill
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, 56, 182, 10, 2, 2, 'F');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(
        `Total Enrolled: ${totalStudents}   |   Present: ${presentCount}   |   Absent: ${
          totalStudents - presentCount
        }   |   Attendance Rate: ${rate}%   |   Method: Edge Neural FaceNet 128D`,
        18,
        62.5
      );

      // Attendance Table
      const tableData = consolidatedList.map((row) => [
        row.slNo,
        row.rollNo,
        row.name,
        row.branch,
        row.timeIn,
        row.confidence,
        row.liveness,
        row.status,
      ]);

      autoTable(doc, {
        startY: 70,
        head: [['#', 'Roll No', 'Student Name', 'Branch', 'Time In', 'Confidence', 'Liveness', 'Status']],
        body: tableData,
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 8.5,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 26 },
          2: { cellWidth: 38 },
          3: { cellWidth: 42 },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 20, halign: 'center' },
          6: { cellWidth: 16, halign: 'center' },
          7: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
        },
      });

      // Signature Block at Bottom
      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 240;
      if (finalY < 260) {
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text('Authorized Signature / Faculty In-Charge:', 14, finalY + 18);
        doc.line(14, finalY + 28, 80, finalY + 28);

        doc.text('Campus Biometric Seal:', 130, finalY + 18);
        doc.line(130, finalY + 28, 190, finalY + 28);
      }

      doc.save(`Drishti_Official_Attendance_Report_${courseCode.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    } finally {
      setTimeout(() => setDownloading(null), 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in duration-150">
      <div className="product-card w-full max-w-lg p-5 shadow-dropdown space-y-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-[#1e2a42]">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white font-sans">
              Export Attendance Records
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#141c2e] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Report Metadata Configuration */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 text-[11px] font-medium">Institution Name</label>
            <input
              type="text"
              value={instituteName}
              onChange={(e) => setInstituteName(e.target.value)}
              className="w-full rounded-md bg-[#090d14] border border-[#1e2a42] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#3b82f6]"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 text-[11px] font-medium">Department</label>
            <input
              type="text"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              className="w-full rounded-md bg-[#090d14] border border-[#1e2a42] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#3b82f6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1 text-[11px] font-medium">Faculty In-Charge</label>
              <input
                type="text"
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                className="w-full rounded-md bg-[#090d14] border border-[#1e2a42] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#3b82f6]"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 text-[11px] font-medium">Session</label>
              <input
                type="text"
                disabled
                value={`${courseCode} (${section})`}
                className="w-full rounded-md bg-[#090d14]/60 border border-[#1e2a42] px-2.5 py-1.5 text-xs text-slate-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1e2a42]">
          <button
            onClick={exportCSV}
            disabled={!!downloading}
            className="btn-secondary"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>{downloading === 'CSV' ? 'Exporting...' : 'Export CSV (ERP Format)'}</span>
          </button>

          <button
            onClick={exportPDF}
            disabled={!!downloading}
            className="btn-primary"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{downloading === 'PDF' ? 'Generating...' : 'Download Official PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
