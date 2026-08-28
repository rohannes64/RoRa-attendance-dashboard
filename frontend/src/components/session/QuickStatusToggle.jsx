import React from 'react';

export default function QuickStatusToggle({ session, sessionStudents, sessionRecords, onMarkStudentStatus, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#1E1610] border border-[#2A1F13] rounded-2xl p-6 shadow-2xl animate-fade-in-up max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-[#2A1F13] shrink-0">
          <div>
            <h3 className="font-serif text-xl text-[#F0E2C8]">Mark Student Status — {session.code}</h3>
            <p className="text-xs text-[#A89070]">Click Present, Late, or Absent to update any student in this session</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#140E07] text-[#A89070] hover:text-[#F0E2C8] flex items-center justify-center text-sm border border-[#2A1F13]"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-2.5 pr-1">
          {sessionStudents.map((st) => {
            const recMatch = sessionRecords.find((r) => r.studentId === st.id || r.studentId === st.studentId);
            const currentStatus = recMatch?.status || "absent";

            return (
              <div
                key={st.id}
                className="p-3 rounded-xl bg-[#140E07] border border-[#2A1F13] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#C4622D]/20 border border-[#C4622D]/40 text-[#E8943A] flex items-center justify-center text-xs font-semibold shrink-0">
                    {st.avatar || st.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <div className="font-medium text-sm text-[#F0E2C8] truncate">{st.name}</div>
                    <div className="text-xs text-[#A89070] font-mono">{st.studentId || st.id}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onMarkStudentStatus(session.id || session.sessionId, st.id, "present")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      currentStatus === "present"
                        ? "bg-emerald-950 border border-emerald-500 text-emerald-400 shadow-sm"
                        : "bg-[#1E1610] text-[#A89070] hover:text-emerald-400 border border-[#2A1F13]"
                    }`}
                  >
                    Present
                  </button>
                  <button
                    onClick={() => onMarkStudentStatus(session.id || session.sessionId, st.id, "late")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      currentStatus === "late"
                        ? "bg-amber-950 border border-amber-500 text-amber-400 shadow-sm"
                        : "bg-[#1E1610] text-[#A89070] hover:text-amber-400 border border-[#2A1F13]"
                    }`}
                  >
                    Late
                  </button>
                  <button
                    onClick={() => onMarkStudentStatus(session.id || session.sessionId, st.id, "absent")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      currentStatus === "absent"
                        ? "bg-rose-950 border border-rose-500 text-rose-400 shadow-sm"
                        : "bg-[#1E1610] text-[#A89070] hover:text-rose-400 border border-[#2A1F13]"
                    }`}
                  >
                    Absent
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-[#2A1F13] shrink-0 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
