import { useState, useEffect, useRef } from "react";

/* ─── types ─────────────────────────────────────────── */
interface Session {
  id: string;
  subject: string;
  code: string;
  instructor: string;
  time: string;
  room: string;
  enrolled: number;
  present: number;
  color: string;
}

interface Attendee {
  id: string;
  name: string;
  studentId: string;
  status: "present" | "absent" | "late";
  time?: string;
}

/* ─── data ───────────────────────────────────────────── */
const SESSIONS: Session[] = [
  { id: "cs301", subject: "Machine Learning", code: "CS 301", instructor: "Dr. Amara Osei", time: "08:00 – 09:30", room: "Lab 4B", enrolled: 28, present: 21, color: "#C4622D" },
  { id: "ds201", subject: "Data Structures", code: "DS 201", instructor: "Prof. Lena Hartmann", time: "10:00 – 11:30", room: "Hall A", enrolled: 34, present: 29, color: "#E8943A" },
  { id: "cv401", subject: "Computer Vision", code: "CV 401", instructor: "Dr. Kenji Mori", time: "13:00 – 14:30", room: "Lab 2C", enrolled: 22, present: 18, color: "#A0522D" },
  { id: "ai502", subject: "AI Ethics", code: "AI 502", instructor: "Dr. Sofia Navarro", time: "15:00 – 16:30", room: "Room 310", enrolled: 19, present: 14, color: "#CD7F32" },
  { id: "db302", subject: "Database Systems", code: "DB 302", instructor: "Prof. Malik James", time: "09:00 – 10:30", room: "Hall B", enrolled: 31, present: 24, color: "#B8601A" },
  { id: "se401", subject: "Software Engineering", code: "SE 401", instructor: "Dr. Priya Menon", time: "11:30 – 13:00", room: "Room 208", enrolled: 26, present: 20, color: "#D4853E" },
];

const BASE_ATTENDEES: Attendee[] = [
  { id: "1", name: "Aisha Kowalski", studentId: "STU-2021-004", status: "present", time: "08:03" },
  { id: "2", name: "Marcus Chen", studentId: "STU-2021-012", status: "present", time: "08:07" },
  { id: "3", name: "Lila Oduya", studentId: "STU-2021-019", status: "late", time: "08:24" },
  { id: "4", name: "Tomás Rivera", studentId: "STU-2022-003", status: "absent" },
  { id: "5", name: "Nadia Petrov", studentId: "STU-2022-011", status: "present", time: "07:58" },
  { id: "6", name: "Kwame Asante", studentId: "STU-2022-027", status: "present", time: "08:01" },
  { id: "7", name: "Yuki Tanaka", studentId: "STU-2023-005", status: "absent" },
  { id: "8", name: "Fatima Al-Hassan", studentId: "STU-2023-014", status: "present", time: "08:09" },
  { id: "9", name: "Ethan Brooks", studentId: "STU-2023-021", status: "present", time: "08:12" },
  { id: "10", name: "Zara Singh", studentId: "STU-2021-031", status: "late", time: "08:31" },
];

/* ─── sub-components ─────────────────────────────────── */

function StatusBadge({ status }: { status: Attendee["status"] }) {
  const map = {
    present: { label: "Present", bg: "bg-emerald-900/60", text: "text-emerald-400", dot: "bg-emerald-400" },
    absent: { label: "Absent", bg: "bg-rose-900/40", text: "text-rose-400", dot: "bg-rose-400" },
    late: { label: "Late", bg: "bg-amber-900/40", text: "text-amber-400", dot: "bg-amber-400" },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${map.bg} ${map.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${map.dot}`} />
      {map.label}
    </span>
  );
}

function FaceDetectionCamera() {
  const [detected, setDetected] = useState(false);
  const [scanPos, setScanPos] = useState(0);
  const [faceBox, setFaceBox] = useState({ x: 28, y: 22, w: 44, h: 52 });

  useEffect(() => {
    const toggle = setInterval(() => {
      setDetected((d) => !d);
      setFaceBox({ x: 26 + Math.random() * 6, y: 20 + Math.random() * 6, w: 42 + Math.random() * 6, h: 50 + Math.random() * 6 });
    }, 2800);
    const scan = setInterval(() => setScanPos((p) => (p + 1.5) % 100), 30);
    return () => { clearInterval(toggle); clearInterval(scan); };
  }, []);

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#0A0704] border border-[#2A1F13]">
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "linear-gradient(#E8943A 1px, transparent 1px), linear-gradient(90deg, #E8943A 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      {/* Scan line */}
      <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E8943A] to-transparent opacity-60 pointer-events-none"
        style={{ top: `${scanPos}%`, transition: "top 30ms linear" }} />

      {/* Corner brackets */}
      {[["top-3 left-3", "border-t-2 border-l-2"],
        ["top-3 right-3", "border-t-2 border-r-2"],
        ["bottom-3 left-3", "border-b-2 border-l-2"],
        ["bottom-3 right-3", "border-b-2 border-r-2"]].map(([pos, border], i) => (
        <div key={i} className={`absolute ${pos} w-6 h-6 ${border} border-[#E8943A] opacity-70`} />
      ))}

      {/* Face bounding box */}
      <div
        className="absolute border-2 transition-all duration-700"
        style={{
          left: `${faceBox.x}%`, top: `${faceBox.y}%`,
          width: `${faceBox.w}%`, height: `${faceBox.h}%`,
          borderColor: detected ? "#C4622D" : "#E8943A",
          boxShadow: detected ? "0 0 24px rgba(196,98,45,0.5)" : "0 0 12px rgba(232,148,58,0.3)",
          animation: detected ? "detect-flash 1.4s ease infinite" : "none",
        }}
      >
        {/* Corner ticks */}
        {["-top-0.5 -left-0.5", "-top-0.5 -right-0.5", "-bottom-0.5 -left-0.5", "-bottom-0.5 -right-0.5"].map((c, i) => (
          <div key={i} className={`absolute ${c} w-3 h-3 bg-[#E8943A]`} style={{ clipPath: i === 0 ? "polygon(0 0,100% 0,0 100%)" : i === 1 ? "polygon(0 0,100% 0,100% 100%)" : i === 2 ? "polygon(0 0,0 100%,100% 100%)" : "polygon(100% 0,0 100%,100% 100%)" }} />
        ))}
      </div>

      {/* Status chip */}
      <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase transition-all duration-500 ${detected ? "bg-[#C4622D] text-[#F0E2C8]" : "bg-[#E8943A]/20 text-[#E8943A] border border-[#E8943A]/40"}`}>
        {detected ? "Identity Confirmed" : "Scanning…"}
      </div>

      {/* Pulse rings */}
      {detected && (
        <div className="absolute" style={{ left: `${faceBox.x + faceBox.w / 2}%`, top: `${faceBox.y + faceBox.h / 2}%` }}>
          {[0, 0.4, 0.8].map((delay, i) => (
            <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#C4622D]"
              style={{ width: 80 + i * 30, height: 80 + i * 30, animation: `pulse-ring 1.6s ease-out ${delay}s infinite` }} />
          ))}
        </div>
      )}

      {/* Info bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#140E07]/70 backdrop-blur-sm px-3 py-1 rounded-full border border-[#2A1F13]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#E8943A] animate-pulse" />
        <span className="text-[#A89070] text-xs tracking-wider font-mono">LIVE · 1080p · 30fps</span>
      </div>
    </div>
  );
}

type EnrollStep = "idle" | "front" | "left" | "right" | "done";

function EnrollSection() {
  const [step, setStep] = useState<EnrollStep>("idle");
  const [captured, setCaptured] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [countdown, setCountdown] = useState(0);

  const angles: { key: EnrollStep; label: string; icon: string; hint: string }[] = [
    { key: "front", label: "Front", icon: "◉", hint: "Look straight at the camera" },
    { key: "left", label: "Left Profile", icon: "◁", hint: "Turn your head slightly left" },
    { key: "right", label: "Right Profile", icon: "▷", hint: "Turn your head slightly right" },
  ];

  const currentAngleIdx = step === "front" ? 0 : step === "left" ? 1 : step === "right" ? 2 : -1;

  const startCapture = (s: EnrollStep) => {
    setStep(s);
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => {
      if (countdown === 1) {
        const label = step === "front" ? "Front" : step === "left" ? "Left" : "Right";
        setCaptured((c) => [...c, label]);
        if (step === "front") startCapture("left");
        else if (step === "left") startCapture("right");
        else { setStep("done"); setCountdown(0); }
      } else {
        setCountdown((c) => c - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [countdown, step]);

  const reset = () => { setStep("idle"); setCaptured([]); setName(""); setStudentId(""); };

  if (step === "done") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10 animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-emerald-900/40 border-2 border-emerald-400 flex items-center justify-center text-2xl">✓</div>
        <h3 className="text-[#F0E2C8] font-serif text-xl">Enrollment Complete</h3>
        <p className="text-[#A89070] text-sm text-center">3 angles captured for <span className="text-[#E8943A]">{name || "Student"}</span></p>
        <button onClick={reset} className="mt-2 px-5 py-2 rounded-full border border-[#C4622D] text-[#C4622D] hover:bg-[#C4622D] hover:text-[#F0E2C8] transition-all text-sm font-medium">
          Enroll Another
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {step === "idle" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[#A89070] text-xs mb-1.5 tracking-wider uppercase">Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aisha Kowalski"
              className="w-full bg-[#1E1610] border border-[#2A1F13] rounded-lg px-3 py-2.5 text-[#F0E2C8] text-sm placeholder:text-[#4A3828] focus:outline-none focus:border-[#E8943A] transition-colors" />
          </div>
          <div>
            <label className="block text-[#A89070] text-xs mb-1.5 tracking-wider uppercase">Student ID</label>
            <input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="STU-2024-001"
              className="w-full bg-[#1E1610] border border-[#2A1F13] rounded-lg px-3 py-2.5 text-[#F0E2C8] text-sm placeholder:text-[#4A3828] focus:outline-none focus:border-[#E8943A] transition-colors" />
          </div>
        </div>
      )}

      {/* Angle steps */}
      <div className="grid grid-cols-3 gap-2">
        {angles.map((a, i) => {
          const done = captured.includes(a.label);
          const active = step === a.key;
          return (
            <div key={a.key} className={`rounded-xl border p-3 text-center transition-all ${done ? "border-emerald-700 bg-emerald-900/20" : active ? "border-[#C4622D] bg-[#C4622D]/10" : "border-[#2A1F13] bg-[#1E1610]"}`}>
              <div className={`text-2xl mb-1 ${done ? "text-emerald-400" : active ? "text-[#E8943A]" : "text-[#4A3828]"}`}>
                {done ? "✓" : active ? (countdown > 0 ? countdown : a.icon) : a.icon}
              </div>
              <div className={`text-xs font-medium ${done ? "text-emerald-400" : active ? "text-[#E8943A]" : "text-[#A89070]"}`}>{a.label}</div>
              {active && <div className="text-[10px] text-[#A89070] mt-0.5">{a.hint}</div>}
            </div>
          );
        })}
      </div>

      {/* Camera preview area */}
      {step !== "idle" && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#0A0704] border border-[#2A1F13]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-40 rounded-full border-2 border-dashed border-[#E8943A]/40 flex items-center justify-center">
              <span className="text-[#4A3828] text-xs text-center">Face<br/>Preview</span>
            </div>
          </div>
          {countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-8xl font-bold text-[#E8943A] opacity-80" style={{ fontFamily: "DM Serif Display, serif" }}>{countdown}</span>
            </div>
          )}
          <div className="absolute bottom-3 inset-x-0 text-center text-xs text-[#A89070]">
            {angles.find(a => a.key === step)?.hint}
          </div>
        </div>
      )}

      {step === "idle" && (
        <button onClick={() => startCapture("front")}
          disabled={!name.trim() || !studentId.trim()}
          className="w-full py-3 rounded-xl bg-[#C4622D] text-[#F0E2C8] font-semibold text-sm tracking-wide hover:bg-[#E8943A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          Begin Enrollment — Capture 3 Angles
        </button>
      )}
    </div>
  );
}

/* ─── Session Page ───────────────────────────────────── */
function SessionPage({ session, onBack }: { session: Session; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<"detect" | "list" | "enroll">("detect");
  const presentCount = BASE_ATTENDEES.filter((a) => a.status === "present").length;
  const lateCount = BASE_ATTENDEES.filter((a) => a.status === "late").length;
  const absentCount = BASE_ATTENDEES.filter((a) => a.status === "absent").length;

  return (
    <div className="min-h-full bg-[#140E07] text-[#F0E2C8]">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-[#140E07]/90 backdrop-blur border-b border-[#2A1F13]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 text-[#A89070] hover:text-[#E8943A] transition-colors text-sm font-medium">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Sessions
          </button>
          <div className="w-px h-5 bg-[#2A1F13]" />
          <div className="flex items-center gap-3 flex-1">
            <span className="text-xs font-mono tracking-widest text-[#C4622D] uppercase">{session.code}</span>
            <h1 className="font-serif text-lg text-[#F0E2C8]">{session.subject}</h1>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <span className="text-[#A89070]">{session.time}</span>
            <span className="text-[#A89070]">{session.room}</span>
            <span className="text-[#A89070]">{session.instructor}</span>
          </div>
        </div>
      </header>

      {/* Stats row */}
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Present", value: presentCount, color: "text-emerald-400", bg: "bg-emerald-900/20 border-emerald-900" },
            { label: "Late", value: lateCount, color: "text-amber-400", bg: "bg-amber-900/20 border-amber-900" },
            { label: "Absent", value: absentCount, color: "text-rose-400", bg: "bg-rose-900/20 border-rose-900" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-4 border ${s.bg} flex items-center gap-4`}>
              <span className={`font-serif text-3xl ${s.color}`}>{s.value}</span>
              <span className="text-[#A89070] text-sm">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1E1610] rounded-xl p-1 mb-6 w-fit">
          {[
            { id: "detect" as const, label: "Live Detection" },
            { id: "list" as const, label: "Attendance" },
            { id: "enroll" as const, label: "Enroll" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-[#C4622D] text-[#F0E2C8]" : "text-[#A89070] hover:text-[#F0E2C8]"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="animate-fade-in-up">
          {activeTab === "detect" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-serif text-lg">Live Feed</h2>
                  <span className="flex items-center gap-2 text-xs text-[#A89070]">
                    <span className="w-2 h-2 rounded-full bg-[#C4622D] animate-pulse" /> Face detection active
                  </span>
                </div>
                <FaceDetectionCamera />
              </div>
              <div className="space-y-3">
                <h2 className="font-serif text-lg mb-3">Recent Detections</h2>
                {BASE_ATTENDEES.filter(a => a.status !== "absent").slice(0, 6).map((a, i) => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#1E1610] border border-[#2A1F13]"
                    style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-[#C4622D]/20 text-[#C4622D]">
                      {a.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      <p className="text-xs text-[#A89070]">{a.time}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "list" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-lg">Attendance List</h2>
                <span className="text-[#A89070] text-sm">{BASE_ATTENDEES.length} students</span>
              </div>
              <div className="rounded-xl border border-[#2A1F13] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1E1610] border-b border-[#2A1F13]">
                      {["Name", "Student ID", "Status", "Check-in"].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold tracking-widest uppercase text-[#A89070]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {BASE_ATTENDEES.map((a, i) => (
                      <tr key={a.id} className={`border-b border-[#2A1F13] last:border-0 hover:bg-[#1E1610]/50 transition-colors ${i % 2 === 0 ? "bg-[#140E07]" : "bg-[#180F08]"}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#C4622D]/20 text-[#C4622D] flex items-center justify-center text-xs font-semibold">
                              {a.name.split(" ").map(n => n[0]).join("")}
                            </div>
                            <span className="font-medium">{a.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-[#A89070] font-mono text-xs">{a.studentId}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
                        <td className="px-5 py-3.5 text-[#A89070]">{a.time ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "enroll" && (
            <div className="max-w-lg">
              <div className="mb-5">
                <h2 className="font-serif text-lg mb-1">Enroll New Student</h2>
                <p className="text-[#A89070] text-sm">Capture 3 face angles to register a student in the recognition model.</p>
              </div>
              <div className="rounded-xl border border-[#2A1F13] bg-[#1E1610] p-6">
                <EnrollSection />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Home Page ──────────────────────────────────────── */
function HomePage({ onSelectSession }: { onSelectSession: (s: Session) => void }) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="min-h-full bg-[#140E07] text-[#F0E2C8]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#140E07]/90 backdrop-blur border-b border-[#2A1F13]">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#C4622D] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5" r="2.5" stroke="#F0E2C8" strokeWidth="1.3"/>
                <path d="M3 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="#F0E2C8" strokeWidth="1.3" strokeLinecap="round"/>
                <circle cx="8" cy="8" r="7" stroke="#F0E2C8" strokeWidth="1.3" strokeDasharray="2 2"/>
              </svg>
            </div>
            <span className="font-serif text-lg tracking-tight">FaceAttend</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-[#E8943A]">{timeStr}</div>
            <div className="text-xs text-[#A89070]">{dateStr}</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Hero */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#C4622D]/40 bg-[#C4622D]/10 text-[#C4622D] text-xs tracking-widest uppercase font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C4622D] animate-pulse" />
            Biometric Attendance System
          </div>
          <h1 className="font-serif text-5xl lg:text-6xl leading-tight mb-4 max-w-2xl">
            Attendance,<br />
            <em className="text-[#C4622D] not-italic">recognized</em> instantly.
          </h1>
          <p className="text-[#A89070] text-lg max-w-lg leading-relaxed">
            Select a class session below to begin real-time face detection and automated attendance tracking.
          </p>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { label: "Active Sessions", value: "6", sub: "Today" },
            { label: "Students Enrolled", value: "160", sub: "Across all classes" },
            { label: "Avg. Attendance", value: "81%", sub: "This week" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[#2A1F13] bg-[#1E1610] px-6 py-5">
              <div className="font-serif text-4xl text-[#E8943A] mb-1">{s.value}</div>
              <div className="text-sm font-medium text-[#F0E2C8]">{s.label}</div>
              <div className="text-xs text-[#A89070]">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Sessions grid */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl">Today's Sessions</h2>
          <span className="text-[#A89070] text-sm">{SESSIONS.length} classes scheduled</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SESSIONS.map((session, i) => {
            const pct = Math.round((session.present / session.enrolled) * 100);
            return (
              <button key={session.id} onClick={() => onSelectSession(session)}
                className="card-hover text-left rounded-2xl border border-[#2A1F13] bg-[#1E1610] overflow-hidden group animate-fade-in-up"
                style={{ animationDelay: `${i * 0.07}s` }}>
                {/* Color stripe */}
                <div className="h-1" style={{ background: `linear-gradient(90deg, ${session.color}, transparent)` }} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-xs font-mono tracking-widest text-[#A89070] uppercase">{session.code}</span>
                      <h3 className="font-serif text-xl mt-0.5 text-[#F0E2C8] group-hover:text-[#E8943A] transition-colors">{session.subject}</h3>
                    </div>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center border border-[#2A1F13] text-[#A89070] group-hover:border-[#C4622D] group-hover:text-[#C4622D] transition-all">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-5">
                    <div className="flex items-center gap-2 text-sm text-[#A89070]">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/><path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                      {session.time}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#A89070]">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="2" width="9" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M4 1v2M8 1v2M1.5 5h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                      {session.room}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#A89070]">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M2 11c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                      {session.instructor}
                    </div>
                  </div>

                  {/* Attendance bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#A89070]">{session.present} present</span>
                      <span style={{ color: session.color }}>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#2A1F13] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${session.color}, #E8943A)` }} />
                    </div>
                    <div className="flex justify-between text-xs mt-1 text-[#4A3828]">
                      <span>{session.enrolled} enrolled</span>
                      <span>{session.enrolled - session.present} absent</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}

/* ─── Root ───────────────────────────────────────────── */
export default function App() {
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  return (
    <div className="size-full overflow-y-auto bg-[#140E07]">
      {activeSession
        ? <SessionPage session={activeSession} onBack={() => setActiveSession(null)} />
        : <HomePage onSelectSession={setActiveSession} />}
    </div>
  );
}
