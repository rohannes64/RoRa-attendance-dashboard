import React from 'react';

export default function CompletedReportModal({ session, students, onClose }) {
  if (!session) return null;

  const assignedStudentIds = session.enrolledStudentIds || ["1", "2", "3", "4", "5", "6"];
  const enrolledCount = assignedStudentIds.length;
  const presentCount = session.present || 0;
  const absentCount = Math.max(0, enrolledCount - presentCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#1E1610] border border-[#2A1F13] rounded-2xl p-6 shadow-2xl animate-fade-in-up max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-[#2A1F13] shrink-0">
          <div>
            <span className="text-xs font-mono text-[#C4622D] font-bold uppercase">{session.code}</span>
            <h3 className="font-serif text-2xl text-[#F0E2C8]">{session.subject} — Archived Report</h3>
            <p className="text-xs text-[#A89070]">Instructor: {session.instructor} • Room: {session.room}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#140E07] text-[#A89070] hover:text-[#F0E2C8] flex items-center justify-center text-sm border border-[#2A1F13]"
          >
            ✕
          </button>
        </div>

        <div className="py-4 shrink-0 grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-[#140E07] border border-[#2A1F13]">
            <div className="text-[10px] uppercase text-[#A89070]">Assigned Students</div>
            <div className="font-serif text-xl text-[#F0E2C8]">{enrolledCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#140E07] border border-[#2A1F13]">
            <div className="text-[10px] uppercase text-[#A89070]">Present</div>
            <div className="font-serif text-xl text-emerald-400">{presentCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#140E07] border border-[#2A1F13]">
            <div className="text-[10px] uppercase text-[#A89070]">Absent</div>
            <div className="font-serif text-xl text-rose-400">{absentCount}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <h4 className="text-xs font-mono text-[#A89070] uppercase mb-2">Student Attendance List</h4>
          <div className="rounded-xl border border-[#2A1F13] overflow-hidden bg-[#140E07]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#2A1F13] bg-[#18110B] text-[#A89070]">
                  <th className="text-left px-4 py-2.5">Student Name</th>
                  <th className="text-left px-4 py-2.5">Roll ID</th>
                  <th className="text-left px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {assignedStudentIds.map((stId, idx) => {
                  const st = students.find((s) => s.id === stId || s.studentId === stId) || { name: `Student ${stId}`, studentId: stId };
                  const isPresent = idx < presentCount;
                  return (
                    <tr key={stId} className="border-b border-[#2A1F13] last:border-0">
                      <td className="px-4 py-2.5 text-[#F0E2C8] font-medium">{st.name}</td>
                      <td className="px-4 py-2.5 text-[#A89070] font-mono">{st.studentId || stId}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isPresent ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30" : "bg-rose-950 text-rose-400 border border-rose-500/30"}`}>
                          {isPresent ? "PRESENT" : "ABSENT"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-4 border-t border-[#2A1F13] shrink-0 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
