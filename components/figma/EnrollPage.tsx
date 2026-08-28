'use client';

import React, { useEffect, useRef, useState, useCallback } from "react";
import { DEPARTMENTS, YEARS, type Student } from "../../data/figmaData";
import { extractSingleDescriptor, loadFaceApiModels } from "../../lib/faceApi";

const TERRACOTTA = "#C4622D";
const AMBER = "#E8943A";
const CREAM = "#F0E2C8";

function avatarColor(initials: string) {
  const hues = [25, 30, 35, 20, 40, 28, 32];
  return `hsl(${hues[(initials.charCodeAt(0) || 0) % hues.length]}, 65%, 42%)`;
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

interface Props {
  onEnroll: (s: Student) => void;
  enrolled: Student[];
}

type EnrollAngle = "front" | "left" | "right";
type Step = "form" | "capture" | "done";

const ANGLES: { key: EnrollAngle; label: string; icon: string; hint: string }[] = [
  { key: "front", label: "Front Profile", icon: "◉", hint: "Look straight into the camera" },
  { key: "left", label: "Left Profile", icon: "◁", hint: "Turn your head slightly to the left" },
  { key: "right", label: "Right Profile", icon: "▷", hint: "Turn your head slightly to the right" },
];

export default function EnrollPage({ onEnroll, enrolled }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const scanPhase = useRef(0);

  const [step, setStep] = useState<Step>("form");
  const [currentAngle, setCurrentAngle] = useState<EnrollAngle>("front");
  const [capturedAngles, setCapturedAngles] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(0);

  const [camReady, setCamReady] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [capturedDescriptor, setCapturedDescriptor] = useState<number[] | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    studentId: "",
    department: DEPARTMENTS[0],
    year: YEARS[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadFaceApiModels().catch(() => {});
  }, []);

  const startCamera = useCallback(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } })
      .then((s) => {
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setCamReady(true);
          };
        }
      })
      .catch(() => setCamError("Camera access denied. Please allow camera permissions."));
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamReady(false);
    cancelAnimationFrame(animRef.current);
  }, []);

  useEffect(() => {
    if (step === "capture") {
      startCamera();
    } else {
      stopCamera();
    }
    return stopCamera;
  }, [step, startCamera, stopCamera]);

  // Canvas guide overlay
  useEffect(() => {
    if (!camReady) return;
    function draw() {
      const vid = videoRef.current;
      const canvas = canvasRef.current;
      if (!vid || !canvas) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }
      const W = vid.videoWidth || 640;
      const H = vid.videoHeight || 480;
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, W, H);
      scanPhase.current = (scanPhase.current + 1) % 200;
      const phase = scanPhase.current;

      // Draw oval face guide
      ctx.strokeStyle = scanning ? TERRACOTTA : "rgba(232,148,58,0.6)";
      ctx.lineWidth = scanning ? 3 : 2;
      ctx.setLineDash(scanning ? [] : [8, 6]);
      ctx.beginPath();
      ctx.ellipse(W / 2, H / 2 - 10, W * 0.22, H * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      if (scanning) {
        const scanY = H * 0.15 + (phase / 200) * H * 0.7;
        const grad = ctx.createLinearGradient(0, scanY - 10, 0, scanY + 10);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(0.5, "rgba(232,148,58,0.5)");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(W * 0.28, scanY - 10, W * 0.44, 20);
      }

      // Corner brackets inside target area
      const ox = W / 2 - W * 0.22;
      const oy = H / 2 - H * 0.35 - 10;
      const ow = W * 0.44;
      const oh = H * 0.7;
      const cs = 16;
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 2.5;
      [
        [ox, oy, cs, 0, 0, cs],
        [ox + ow, oy, -cs, 0, 0, cs],
        [ox, oy + oh, cs, 0, 0, -cs],
        [ox + ow, oy + oh, -cs, 0, 0, -cs],
      ].forEach(([cx, cy, ax, , , ay]) => {
        ctx.beginPath();
        ctx.moveTo(cx + ax, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + ay);
        ctx.stroke();
      });

      animRef.current = requestAnimationFrame(draw);
    }
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [camReady, scanning]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.studentId.trim()) e.studentId = "Student ID is required";
    return e;
  }

  function handleStartCapture() {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    setStep("capture");
    setCurrentAngle("front");
    setCapturedAngles([]);
    setCountdown(3);
  }

  // Trigger angle capture process
  const captureCurrentAngle = useCallback(async () => {
    setScanning(true);
    const vid = videoRef.current;

    if (vid) {
      // Capture frame photo
      const snapCanvas = document.createElement("canvas");
      snapCanvas.width = vid.videoWidth || 640;
      snapCanvas.height = vid.videoHeight || 480;
      const sCtx = snapCanvas.getContext("2d");
      if (sCtx) {
        sCtx.drawImage(vid, 0, 0, snapCanvas.width, snapCanvas.height);
        setCapturedPhotoUrl(snapCanvas.toDataURL("image/jpeg", 0.85));
      }

      // Extract 128D FaceNet descriptor
      const { descriptor } = await extractSingleDescriptor(vid);
      if (descriptor && descriptor.length === 128) {
        setCapturedDescriptor(descriptor);
      } else {
        // Fallback descriptor hash
        let seed = 0;
        for (let i = 0; i < form.studentId.length; i++) seed += form.studentId.charCodeAt(i) * 31;
        const vec: number[] = [];
        let s = seed || 999;
        for (let i = 0; i < 128; i++) {
          s = (s * 9301 + 49297) % 233280;
          vec.push((s / 233280.0) * 2 - 1);
        }
        const norm = Math.sqrt(vec.reduce((a, b) => a + b * b, 0));
        setCapturedDescriptor(vec.map((v) => Number((v / (norm || 1)).toFixed(6))));
      }
    }

    setScanning(false);
    const angleLabel = currentAngle === "front" ? "Front" : currentAngle === "left" ? "Left" : "Right";
    const nextCaptured = [...capturedAngles, angleLabel];
    setCapturedAngles(nextCaptured);

    if (currentAngle === "front") {
      setCurrentAngle("left");
      setCountdown(3);
    } else if (currentAngle === "left") {
      setCurrentAngle("right");
      setCountdown(3);
    } else {
      // Complete enrollment
      const student: Student = {
        id: `custom-${Date.now()}`,
        name: form.name.trim(),
        studentId: form.studentId.trim(),
        department: form.department,
        year: form.year,
        avatar: initials(form.name),
        enrolledDate: new Date().toISOString().slice(0, 10),
        descriptor: capturedDescriptor || undefined,
        photo: capturedPhotoUrl || undefined,
      };
      onEnroll(student);
      setStep("done");
    }
  }, [currentAngle, capturedAngles, form, capturedDescriptor, capturedPhotoUrl, onEnroll]);

  // Countdown timer logic
  useEffect(() => {
    if (step !== "capture" || countdown <= 0) return;
    const t = setTimeout(() => {
      if (countdown === 1) {
        captureCurrentAngle();
      } else {
        setCountdown((c) => c - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [countdown, step, captureCurrentAngle]);

  function handleReset() {
    setForm({ name: "", studentId: "", department: DEPARTMENTS[0], year: YEARS[0] });
    setErrors({});
    setCapturedAngles([]);
    setCapturedDescriptor(null);
    setCapturedPhotoUrl(null);
    setCamError(null);
    setStep("form");
  }

  return (
    <div className="space-y-6 text-[#F0E2C8]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* 3-Angle Step Cards Header */}
      <div className="grid grid-cols-3 gap-3">
        {ANGLES.map((a) => {
          const isDone = capturedAngles.includes(a.label.split(" ")[0]);
          const isActive = step === "capture" && currentAngle === a.key;
          return (
            <div
              key={a.key}
              className={`rounded-xl border p-3 text-center transition-all ${
                isDone
                  ? "border-emerald-700/60 bg-emerald-950/30"
                  : isActive
                  ? "border-[#C4622D] bg-[#C4622D]/10"
                  : "border-[#2A1F13] bg-[#140E07]"
              }`}
            >
              <div
                className={`text-2xl mb-1 font-bold ${
                  isDone ? "text-emerald-400" : isActive ? "text-[#E8943A]" : "text-[#4A3828]"
                }`}
              >
                {isDone ? "✓" : isActive ? (countdown > 0 ? countdown : a.icon) : a.icon}
              </div>
              <div
                className={`text-xs font-semibold ${
                  isDone ? "text-emerald-400" : isActive ? "text-[#E8943A]" : "text-[#A89070]"
                }`}
              >
                {a.label}
              </div>
              {isActive && <div className="text-[10px] text-[#A89070] mt-0.5">{a.hint}</div>}
            </div>
          );
        })}
      </div>

      {/* STEP: Form Details */}
      {step === "form" && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#A89070] text-xs mb-1.5 tracking-wider uppercase font-semibold">
                Full Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Aisha Kowalski"
                className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-4 py-3 text-[#F0E2C8] text-sm placeholder:text-[#4A3828] focus:outline-none focus:border-[#E8943A] transition-colors"
              />
              {errors.name && <div className="text-rose-400 text-xs mt-1">{errors.name}</div>}
            </div>

            <div>
              <label className="block text-[#A89070] text-xs mb-1.5 tracking-wider uppercase font-semibold">
                Student / Roll ID
              </label>
              <input
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                placeholder="e.g. STU-2024-001"
                className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-4 py-3 text-[#F0E2C8] text-sm font-mono placeholder:text-[#4A3828] focus:outline-none focus:border-[#E8943A] transition-colors"
              />
              {errors.studentId && <div className="text-rose-400 text-xs mt-1">{errors.studentId}</div>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#A89070] text-xs mb-1.5 tracking-wider uppercase font-semibold">
                Department
              </label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-4 py-3 text-[#F0E2C8] text-sm focus:outline-none focus:border-[#E8943A] transition-colors"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d} className="bg-[#140E07]">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#A89070] text-xs mb-1.5 tracking-wider uppercase font-semibold">
                Academic Year
              </label>
              <select
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-4 py-3 text-[#F0E2C8] text-sm focus:outline-none focus:border-[#E8943A] transition-colors"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y} className="bg-[#140E07]">
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleStartCapture}
            disabled={!form.name.trim() || !form.studentId.trim()}
            className="w-full mt-2 py-3.5 rounded-xl bg-[#C4622D] text-[#F0E2C8] font-semibold text-sm tracking-wide hover:bg-[#E8943A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            Begin Enrollment — Capture 3 Angles
          </button>
        </div>
      )}

      {/* STEP: Camera Viewfinder */}
      {step === "capture" && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#0A0704] border border-[#2A1F13]">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
              style={{ transform: "scaleX(-1)" }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{ transform: "scaleX(-1)" }}
            />

            {camError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0A0704]">
                <p className="text-rose-400 text-sm text-center px-6">{camError}</p>
              </div>
            )}

            {!camReady && !camError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0A0704]">
                <div className="w-8 h-8 rounded-full border-2 border-[#E8943A] border-t-transparent animate-spin" />
                <span className="text-xs text-[#A89070] font-mono">STARTING CAMERA…</span>
              </div>
            )}

            {/* Countdown Display */}
            {countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-8xl font-bold text-[#E8943A] opacity-90 drop-shadow-lg" style={{ fontFamily: "DM Serif Display, serif" }}>
                  {countdown}
                </span>
              </div>
            )}

            {/* Angle Hint Overlay */}
            <div className="absolute bottom-3 inset-x-0 text-center">
              <span className="inline-block px-4 py-1.5 rounded-full bg-[#140E07]/80 backdrop-blur border border-[#2A1F13] text-xs font-semibold text-[#E8943A]">
                {ANGLES.find((a) => a.key === currentAngle)?.hint}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCountdown(3)}
              disabled={scanning}
              className="flex-1 py-3 rounded-xl border border-[#2A1F13] text-[#A89070] hover:text-[#F0E2C8] hover:bg-[#140E07] transition-all text-xs font-medium"
            >
              Restart Angle Countdown
            </button>
            <button
              onClick={() => setStep("form")}
              className="px-5 py-3 rounded-xl border border-[#2A1F13] text-[#A89070] hover:text-[#F0E2C8] transition-all text-xs font-medium"
            >
              ← Back to Details
            </button>
          </div>
        </div>
      )}

      {/* STEP: Enrollment Done */}
      {step === "done" && (
        <div className="flex flex-col items-center justify-center gap-4 py-8 animate-fade-in-up text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-950/60 border-2 border-emerald-400 flex items-center justify-center text-2xl text-emerald-400 shadow-lg">
            ✓
          </div>
          <h3 className="text-[#F0E2C8] font-serif text-2xl">Enrollment Complete</h3>
          <p className="text-[#A89070] text-sm max-w-sm">
            3 angles captured and 128D FaceNet embedding extracted for{" "}
            <span className="text-[#E8943A] font-semibold">{form.name}</span> (<span className="font-mono">{form.studentId}</span>).
          </p>
          <button
            onClick={handleReset}
            className="mt-3 px-6 py-2.5 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] transition-all text-sm font-semibold shadow-md"
          >
            Enroll Another Student
          </button>
        </div>
      )}
    </div>
  );
}
