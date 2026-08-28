import React from 'react';

export default function StatusBadge({ status }) {
  const map = {
    present: { label: "Present", bg: "bg-emerald-950/60 border border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-400" },
    absent: { label: "Absent", bg: "bg-rose-950/60 border border-rose-500/30", text: "text-rose-400", dot: "bg-rose-400" },
    late: { label: "Late", bg: "bg-amber-950/60 border border-amber-500/30", text: "text-amber-400", dot: "bg-amber-400" },
  }[status] || { label: "Present", bg: "bg-emerald-950/60 border border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-400" };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${map.bg} ${map.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${map.dot}`} />
      {map.label}
    </span>
  );
}
