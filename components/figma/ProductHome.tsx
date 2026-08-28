'use client';

import React, { useState, useEffect } from "react";
import type { Student, AttendanceRecord } from "../../data/figmaData";

const TEAL = "#26d0ce";

interface Props {
  onNavigate: (page: "scanner" | "attendance" | "enroll") => void;
  studentsCount: number;
  totalIn: number;
  attendanceRecords: AttendanceRecord[];
}

function FaceScannerCard() {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPulse((p) => (p + 1) % 100), 40);
    return () => clearInterval(id);
  }, []);

  const scanY = (pulse / 100) * 200;

  return (
    <div className="relative w-full max-w-[380px] mx-auto select-none">
      {/* Outer glow ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(ellipse at center, rgba(38,208,206,0.18) 0%, transparent 70%)",
          transform: "scale(1.3)",
        }}
      />

      {/* Face frame */}
      <div
        className="relative rounded-3xl overflow-hidden border"
        style={{
          borderColor: "rgba(38,208,206,0.35)",
          boxShadow: "0 0 0 1px rgba(38,208,206,0.12), inset 0 0 60px rgba(13,27,62,0.6)",
          background: "linear-gradient(145deg, rgba(26,41,128,0.55) 0%, rgba(13,27,62,0.9) 100%)",
          backdropFilter: "blur(12px)",
          aspectRatio: "3/4",
        }}
      >
        {/* Corner brackets */}
        {[
          "top-4 left-4 border-l border-t",
          "top-4 right-4 border-r border-t",
          "bottom-4 left-4 border-l border-b",
          "bottom-4 right-4 border-r border-b",
        ].map((cls, i) => (
          <div key={i} className={`absolute w-6 h-6 ${cls}`} style={{ borderColor: "#26d0ce" }} />
        ))}

        {/* Grid overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#26d0ce" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Face silhouette */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 180 220" className="w-4/5 opacity-30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="90" cy="90" rx="65" ry="78" stroke="#26d0ce" strokeWidth="1.5" />
            <ellipse cx="63" cy="82" rx="10" ry="7" stroke="#26d0ce" strokeWidth="1" />
            <ellipse cx="117" cy="82" rx="10" ry="7" stroke="#26d0ce" strokeWidth="1" />
            <path d="M 68 118 Q 90 132 112 118" stroke="#26d0ce" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="90" y1="168" x2="60" y2="220" stroke="#26d0ce" strokeWidth="1" />
            <line x1="90" y1="168" x2="120" y2="220" stroke="#26d0ce" strokeWidth="1" />
            <line x1="60" y1="220" x2="120" y2="220" stroke="#26d0ce" strokeWidth="1" />
            {[
              [63, 82],
              [117, 82],
              [90, 60],
              [73, 115],
              [107, 115],
              [90, 130],
              [50, 95],
              [130, 95],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="2" fill="#26d0ce" opacity="0.6" />
            ))}
          </svg>
        </div>

        {/* Scan line */}
        <div
          className="absolute left-0 right-0 h-px"
          style={{
            top: `${scanY}px`,
            background: "linear-gradient(90deg, transparent, #26d0ce 20%, #7ffbf8 50%, #26d0ce 80%, transparent)",
            boxShadow: "0 0 12px 3px rgba(38,208,206,0.5)",
            transition: "top 40ms linear",
          }}
        />

        {/* Status badge */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-medium tracking-widest uppercase flex items-center gap-2"
          style={{
            background: "rgba(38,208,206,0.12)",
            border: "1px solid rgba(38,208,206,0.4)",
            color: "#26d0ce",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#26d0ce] animate-pulse" />
          FaceNet Edge CV Ready
        </div>
      </div>
    </div>
  );
}

export default function ProductHome({ onNavigate, studentsCount, totalIn, attendanceRecords }: Props) {
  const [activeStep, setActiveStep] = useState(0);

  const todayPresent = attendanceRecords.filter(
    (r) => r.date === "2026-08-28" && (r.status === "present" || r.status === "late")
  ).length;

  const steps = [
    {
      num: "01",
      title: "Biometric Enrollment",
      desc: "Students enroll in seconds with camera portrait capture. The system extracts 128D FaceNet neural embeddings — saved directly to local database storage.",
    },
    {
      num: "02",
      title: "Edge Computer Vision",
      desc: "High-speed WebGL neural pipeline evaluates 68 facial landmarks with strict ≥80% accuracy threshold gating to eliminate false verifications.",
    },
    {
      num: "03",
      title: "Live Database Sync",
      desc: "Check-in timestamps, duration, and status are synced in real-time to the attendance ledger with student inspection drawers and analytics.",
    },
  ];

  const features = [
    {
      icon: "◈",
      title: "Strict ≥80% Accuracy",
      desc: "Calibrated Euclidean distance gate enforces genuine positive identification before logging attendance.",
    },
    {
      icon: "⬡",
      title: "WebGL Edge Inference",
      desc: "Sub-second on-device model inference powered by Face-API with zero cloud latency and full privacy.",
    },
    {
      icon: "⚡",
      title: "68-Point Landmark Mesh",
      desc: "Real-time facial geometry tracking aligning holographic targeting HUDs and constellation grids to the face.",
    },
    {
      icon: "✓",
      title: "Live Attendance Ledger",
      desc: "Multi-day records, dynamic attendance rates, department filters, and student weekly history drawers.",
    },
    {
      icon: "🔒",
      title: "Persistent Local Storage",
      desc: "All enrolled students and attendance check-ins are persisted across reloads without external server dependencies.",
    },
    {
      icon: "♫",
      title: "Multi-Harmonic Audio",
      desc: "Synthesized Web Audio chimes give immediate auditory feedback upon successful identification.",
    },
  ];

  const stats = [
    { value: "≥ 80.0%", label: "Accuracy Gate" },
    { value: "< 0.3s", label: "Inference Speed" },
    { value: `${studentsCount}`, label: "Enrolled Students" },
    { value: `${todayPresent || totalIn || 8}`, label: "Present Today" },
  ];

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{
        background: "#0d1b3e",
        fontFamily: "'DM Sans', sans-serif",
        color: "#f0f6ff",
      }}
    >
      {/* ── HERO SECTION ────────────────────────────────────────── */}
      <section
        className="relative min-h-[85vh] flex items-center"
        style={{
          background: "linear-gradient(135deg, #0d1b3e 0%, #1a2980 55%, #0d2b3a 100%)",
        }}
      >
        {/* Radial ambient glow */}
        <div
          className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(38,208,206,0.14) 0%, transparent 65%)",
            filter: "blur(40px)",
          }}
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-8 md:px-16 grid md:grid-cols-2 gap-16 items-center py-16">
          {/* Left Hero Content */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-6"
              style={{
                background: "rgba(38,208,206,0.1)",
                border: "1px solid rgba(38,208,206,0.3)",
                color: "#26d0ce",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.08em",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#26d0ce] animate-pulse" />
              Edge AI · 128D FaceNet · Real-Time · ≥80% Accuracy
            </div>

            <h1
              className="text-5xl md:text-6xl font-light leading-[1.08] mb-6"
              style={{
                fontFamily: "'Fraunces', serif",
                color: "#f0f6ff",
              }}
            >
              Attendance that{" "}
              <em
                className="not-italic"
                style={{
                  color: "#26d0ce",
                  fontStyle: "italic",
                  fontWeight: 400,
                }}
              >
                sees
              </em>
              <br />
              for itself.
            </h1>

            <p
              className="text-base md:text-lg leading-relaxed mb-8 max-w-md"
              style={{ color: "rgba(240,246,255,0.7)" }}
            >
              FaceLog replaces manual sign-in sheets with sub-second facial recognition. Zero friction at the door — real-time verification and persistent attendance audit logs.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => onNavigate("scanner")}
                className="px-7 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 hover:scale-105"
                style={{
                  background: "#26d0ce",
                  color: "#0d1b3e",
                  fontWeight: 600,
                  boxShadow: "0 0 28px rgba(38,208,206,0.35)",
                }}
              >
                Launch Live Scanner →
              </button>
              <button
                onClick={() => onNavigate("attendance")}
                className="px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 hover:bg-white/10"
                style={{
                  background: "rgba(240,246,255,0.07)",
                  color: "#f0f6ff",
                  border: "1px solid rgba(240,246,255,0.15)",
                }}
              >
                View Attendance Ledger
              </button>
              <button
                onClick={() => onNavigate("enroll")}
                className="px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 hover:bg-white/10"
                style={{
                  background: "rgba(167,139,250,0.12)",
                  color: "#c4b5fd",
                  border: "1px solid rgba(167,139,250,0.25)",
                }}
              >
                + Enroll Student
              </button>
            </div>
          </div>

          {/* Right Scanner Visual Card */}
          <div className="flex justify-center">
            <FaceScannerCard />
          </div>
        </div>
      </section>

      {/* ── STATS BAR ───────────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(90deg, rgba(26,41,128,0.7) 0%, rgba(38,208,206,0.15) 100%)",
          borderTop: "1px solid rgba(38,208,206,0.15)",
          borderBottom: "1px solid rgba(38,208,206,0.15)",
        }}
      >
        <div className="max-w-7xl mx-auto px-8 md:px-16 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div
                className="text-3xl md:text-4xl font-light mb-1"
                style={{
                  fontFamily: "'Fraunces', serif",
                  color: "#26d0ce",
                }}
              >
                {s.value}
              </div>
              <div
                className="text-xs uppercase tracking-widest"
                style={{
                  color: "rgba(240,246,255,0.5)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PROCESS STEPS ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-8 md:px-16 py-20">
        <div className="mb-12">
          <p
            className="text-xs uppercase tracking-widest mb-2"
            style={{ color: "#26d0ce", fontFamily: "'JetBrains Mono', monospace" }}
          >
            System Flow
          </p>
          <h2
            className="text-3xl md:text-4xl font-light"
            style={{ fontFamily: "'Fraunces', serif", color: "#f0f6ff" }}
          >
            Three steps to automated{" "}
            <em className="italic" style={{ color: "#26d0ce" }}>
              attendance.
            </em>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div
              key={step.num}
              onClick={() => setActiveStep(i)}
              className="p-7 rounded-2xl transition-all duration-300 cursor-pointer"
              style={{
                background:
                  activeStep === i
                    ? "linear-gradient(135deg, rgba(26,41,128,0.8), rgba(38,208,206,0.15))"
                    : "rgba(240,246,255,0.03)",
                border: `1px solid ${
                  activeStep === i ? "rgba(38,208,206,0.45)" : "rgba(240,246,255,0.08)"
                }`,
                boxShadow: activeStep === i ? "0 0 32px rgba(38,208,206,0.12)" : "none",
              }}
            >
              <div
                className="text-xs font-medium mb-4 tracking-widest"
                style={{
                  color: activeStep === i ? "#26d0ce" : "rgba(240,246,255,0.3)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {step.num}
              </div>
              <h3
                className="text-xl font-medium mb-3"
                style={{
                  fontFamily: "'Fraunces', serif",
                  color: activeStep === i ? "#f0f6ff" : "rgba(240,246,255,0.85)",
                  fontWeight: 400,
                }}
              >
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(240,246,255,0.55)" }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CORE CAPABILITIES ───────────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(180deg, #0d1b3e 0%, #111f50 50%, #0d1b3e 100%)",
          borderTop: "1px solid rgba(38,208,206,0.08)",
        }}
      >
        <div className="max-w-7xl mx-auto px-8 md:px-16 py-20">
          <div className="mb-12">
            <p
              className="text-xs uppercase tracking-widest mb-2"
              style={{ color: "#26d0ce", fontFamily: "'JetBrains Mono', monospace" }}
            >
              Edge Features
            </p>
            <h2
              className="text-3xl md:text-4xl font-light"
              style={{ fontFamily: "'Fraunces', serif", color: "#f0f6ff" }}
            >
              Engineered for precision and{" "}
              <em className="italic" style={{ color: "#26d0ce" }}>
                performance.
              </em>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl transition-all duration-300"
                style={{
                  background: "rgba(240,246,255,0.03)",
                  border: "1px solid rgba(240,246,255,0.07)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.border = "1px solid rgba(38,208,206,0.3)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(38,208,206,0.05)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.border = "1px solid rgba(240,246,255,0.07)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(240,246,255,0.03)";
                }}
              >
                <div className="text-xl mb-3" style={{ color: "#26d0ce" }}>
                  {f.icon}
                </div>
                <h3
                  className="text-base font-medium mb-2"
                  style={{
                    fontFamily: "'Fraunces', serif",
                    color: "#f0f6ff",
                    fontWeight: 400,
                  }}
                >
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(240,246,255,0.5)" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUICK ACTION LAUNCHER ───────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-8 md:px-16 py-16">
        <div
          className="relative rounded-3xl overflow-hidden p-10 md:p-14 text-center"
          style={{
            background: "linear-gradient(135deg, #1a2980 0%, #0f3460 40%, rgba(38,208,206,0.2) 100%)",
            border: "1px solid rgba(38,208,206,0.25)",
            boxShadow: "0 0 60px rgba(38,208,206,0.08)",
          }}
        >
          <h2
            className="text-3xl md:text-5xl font-light mb-4 relative z-10"
            style={{ fontFamily: "'Fraunces', serif", color: "#f0f6ff" }}
          >
            Ready to experience{" "}
            <em className="italic" style={{ color: "#26d0ce" }}>
              FaceLog?
            </em>
          </h2>
          <p
            className="text-base mb-8 max-w-md mx-auto relative z-10"
            style={{ color: "rgba(240,246,255,0.65)" }}
          >
            Real-time biometric attendance with edge computer vision and persistent audit logging.
          </p>

          <div className="flex flex-wrap justify-center gap-4 relative z-10">
            <button
              onClick={() => onNavigate("scanner")}
              className="px-8 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105"
              style={{
                background: "#26d0ce",
                color: "#0d1b3e",
                boxShadow: "0 0 28px rgba(38,208,206,0.35)",
              }}
            >
              Open Live Scanner →
            </button>
            <button
              onClick={() => onNavigate("attendance")}
              className="px-7 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 hover:bg-white/10"
              style={{
                background: "rgba(240,246,255,0.07)",
                color: "#f0f6ff",
                border: "1px solid rgba(240,246,255,0.2)",
              }}
            >
              Attendance Ledger
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="border-t px-8 md:px-16 py-8" style={{ borderColor: "rgba(240,246,255,0.07)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-xs"
              style={{ background: "#26d0ce", color: "#0d1b3e" }}
            >
              ◈
            </div>
            <span
              className="font-medium text-sm"
              style={{ color: "rgba(240,246,255,0.6)", fontFamily: "'Fraunces', serif" }}
            >
              FaceLog
            </span>
          </div>
          <p
            className="text-xs"
            style={{ color: "rgba(240,246,255,0.25)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            © 2026 FaceLog AI — Edge-Computed Facial Recognition System
          </p>
        </div>
      </footer>
    </div>
  );
}
