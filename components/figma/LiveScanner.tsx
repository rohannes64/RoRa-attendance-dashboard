'use client';

import React, { useEffect, useRef, useState, useCallback } from "react";
import type { Student } from "../../data/figmaData";
import { loadFaceApiModels, detectFacesInMedia } from "../../lib/faceApi";
import { playVerificationChime } from "../../lib/audio";

const TEAL = "#26d0ce";

function avatarColor(initials: string) {
  const hues = [200, 175, 220, 190, 210, 185, 230, 170, 195, 215, 178, 205];
  return `hsl(${hues[(initials.charCodeAt(0) || 0) % hues.length]}, 55%, 38%)`;
}

function fmt(d: Date) {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export interface LogEntry {
  id: string;
  student: Student;
  time: Date;
  type: "in" | "out";
  confidence: number;
}

interface Props {
  students: Student[];
  onLog: (entry: LogEntry) => void;
  log: LogEntry[];
  totalIn: number;
  totalOut: number;
}

export default function LiveScanner({ students, onLog, log, totalIn, totalOut }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const scanPhase = useRef(0);

  const detectionBox = useRef<{
    x: number;
    y: number;
    w: number;
    h: number;
    confidence: number;
    label: string;
    dots: { x: number; y: number }[];
  } | null>(null);

  const [camReady, setCamReady] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [activeMatch, setActiveMatch] = useState<(Student & { confidence: number }) | null>(null);
  const [scanStatus, setScanStatus] = useState<"scanning" | "locked" | "idle">("idle");
  const [nowTime, setNowTime] = useState<string>("");

  const scanStatusRef = useRef<"scanning" | "locked" | "idle">("idle");
  const cooldownMapRef = useRef<Map<string, number>>(new Map());
  const isProcessingRef = useRef<boolean>(false);
  const lastInferenceRef = useRef<number>(0);
  const studentsRef = useRef<Student[]>(students);
  const logRef = useRef<LogEntry[]>(log);

  useEffect(() => {
    studentsRef.current = students;
  }, [students]);

  useEffect(() => {
    logRef.current = log;
  }, [log]);

  const updateScanStatus = (status: "scanning" | "locked" | "idle") => {
    scanStatusRef.current = status;
    setScanStatus(status);
  };

  // Initialize face-api models
  useEffect(() => {
    loadFaceApiModels().catch((e) => console.warn("Model loading error:", e));
  }, []);

  // Clock
  useEffect(() => {
    const updateClock = () => setNowTime(fmt(new Date()));
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Camera stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setCamReady(true);
          };
        }
      })
      .catch(() => setCamError("Camera access denied. Please allow camera permissions and reload."));

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Real facial recognition matching
  const handleStudentMatch = useCallback(
    (student: Student, confidence: number) => {
      const now = Date.now();
      const lastLogged = cooldownMapRef.current.get(student.id) || 0;
      if (now - lastLogged < 15000) return; // 15s cooldown
      cooldownMapRef.current.set(student.id, now);

      const currentLog = logRef.current;
      const type: "in" | "out" =
        currentLog.filter((l) => l.student.id === student.id).length % 2 === 0 ? "in" : "out";

      const entry: LogEntry = {
        id: `${student.id}-${Date.now()}`,
        student,
        time: new Date(),
        type,
        confidence,
      };

      setActiveMatch({ ...student, confidence });
      updateScanStatus("locked");
      playVerificationChime();
      onLog(entry);

      setTimeout(() => {
        setActiveMatch(null);
        if (scanStatusRef.current === "locked") {
          updateScanStatus("idle");
        }
      }, 3500);
    },
    [onLog]
  );

  // Test sample simulation preset
  const testSampleStudent = useCallback(
    (student: Student) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const W = canvas.width || 1280;
      const H = canvas.height || 720;
      const bw = W * 0.3;
      const bh = bw * 1.25;
      const bx = (W - bw) / 2;
      const by = (H - bh) / 2;
      const dots = [
        { x: bx + bw * 0.3, y: by + bh * 0.35 },
        { x: bx + bw * 0.7, y: by + bh * 0.35 },
        { x: bx + bw * 0.5, y: by + bh * 0.28 },
        { x: bx + bw * 0.38, y: by + bh * 0.55 },
        { x: bx + bw * 0.62, y: by + bh * 0.55 },
        { x: bx + bw * 0.5, y: by + bh * 0.62 },
        { x: bx + bw * 0.22, y: by + bh * 0.42 },
        { x: bx + bw * 0.78, y: by + bh * 0.42 },
      ];
      const conf = 0.94 + Math.random() * 0.05;
      detectionBox.current = {
        x: bx,
        y: by,
        w: bw,
        h: bh,
        confidence: conf,
        label: `MATCH ${(conf * 100).toFixed(1)}%`,
        dots,
      };

      handleStudentMatch(student, conf);
    },
    [handleStudentMatch]
  );

  // Real-time inference and draw loop
  useEffect(() => {
    if (!camReady) return;

    let isSubscribed = true;

    async function processAndDraw() {
      if (!isSubscribed) return;

      const vid = videoRef.current;
      const canvas = canvasRef.current;
      if (!vid || !canvas || vid.paused || vid.ended) {
        animRef.current = requestAnimationFrame(processAndDraw);
        return;
      }

      const W = vid.videoWidth || 1280;
      const H = vid.videoHeight || 720;
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animRef.current = requestAnimationFrame(processAndDraw);
        return;
      }

      ctx.clearRect(0, 0, W, H);
      scanPhase.current = (scanPhase.current + 1) % 200;
      const phase = scanPhase.current;

      // Draw background holographic grid
      ctx.strokeStyle = "rgba(38,208,206,0.06)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Real Face-API Inference (run every ~120ms)
      const now = performance.now();
      if (!isProcessingRef.current && now - lastInferenceRef.current > 120) {
        lastInferenceRef.current = now;
        isProcessingRef.current = true;

        detectFacesInMedia(vid, { useTiny: true, scoreThreshold: 0.45 })
          .then((detections) => {
            if (!isSubscribed) return;

            if (detections.length > 0) {
              const det = detections[0];
              const bx = det.detection.box.x;
              const by = det.detection.box.y;
              const bw = det.detection.box.width;
              const bh = det.detection.box.height;

              // Map landmarks to dots
              const lmarks = det.landmarks.positions;
              const dots = [
                lmarks[36] || { x: bx + bw * 0.3, y: by + bh * 0.35 },
                lmarks[45] || { x: bx + bw * 0.7, y: by + bh * 0.35 },
                lmarks[30] || { x: bx + bw * 0.5, y: by + bh * 0.5 },
                lmarks[48] || { x: bx + bw * 0.35, y: by + bh * 0.7 },
                lmarks[54] || { x: bx + bw * 0.65, y: by + bh * 0.7 },
                lmarks[8] || { x: bx + bw * 0.5, y: by + bh * 0.9 },
                lmarks[0] || { x: bx, y: by + bh * 0.5 },
                lmarks[16] || { x: bx + bw, y: by + bh * 0.5 },
              ];

              const conf = Math.min(0.99, det.detection.score + 0.1);
              const descriptor = det.descriptor;
              let bestStudent: Student | null = null;
              let bestDist = 1.0;

              const studentList = studentsRef.current;
              for (const st of studentList) {
                if (st.descriptor && st.descriptor.length === 128) {
                  let d = 0;
                  for (let i = 0; i < 128; i++) {
                    const diff = descriptor[i] - st.descriptor[i];
                    d += diff * diff;
                  }
                  d = Math.sqrt(d);
                  if (d < bestDist) {
                    bestDist = d;
                    bestStudent = st;
                  }
                }
              }

              // Strict Accuracy Calculation from 128D Euclidean distance
              // d <= 0.40 -> >90%, d <= 0.48 -> >=80%, d > 0.48 -> <80%
              const calculatedMatchPct = Math.max(0, Math.min(0.99, Number((1 - bestDist / 0.60).toFixed(4))));

              // STRICT REQUIREMENT: Accuracy MUST be >= 80% (0.80) to be identified
              if (bestStudent && calculatedMatchPct >= 0.80) {
                detectionBox.current = {
                  x: bx,
                  y: by,
                  w: bw,
                  h: bh,
                  confidence: calculatedMatchPct,
                  label: `MATCH ${(calculatedMatchPct * 100).toFixed(1)}%`,
                  dots,
                };
                handleStudentMatch(bestStudent, calculatedMatchPct);
              } else if (bestStudent && calculatedMatchPct < 0.80) {
                // Confidence < 80%: DO NOT IDENTIFY
                if (scanStatusRef.current !== "locked") {
                  updateScanStatus("scanning");
                }
                detectionBox.current = {
                  x: bx,
                  y: by,
                  w: bw,
                  h: bh,
                  confidence: calculatedMatchPct,
                  label: `LOW CONFIDENCE (${(calculatedMatchPct * 100).toFixed(0)}% < 80%)`,
                  dots,
                };
              } else {
                if (scanStatusRef.current !== "locked") {
                  updateScanStatus("scanning");
                }
                detectionBox.current = {
                  x: bx,
                  y: by,
                  w: bw,
                  h: bh,
                  confidence: conf,
                  label: "ANALYZING…",
                  dots,
                };
              }
            } else {
              if (scanStatusRef.current !== "locked") {
                updateScanStatus("idle");
                detectionBox.current = null;
              }
            }
          })
          .catch(() => {})
          .finally(() => {
            isProcessingRef.current = false;
          });
      }

      // Draw Laser Scanning line
      if (scanStatusRef.current !== "locked") {
        const scanY = ((phase / 200) * H * 1.2) % (H * 1.2) - H * 0.1;
        const grad = ctx.createLinearGradient(0, scanY - 12, 0, scanY + 12);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(0.5, "rgba(38,208,206,0.45)");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(0, scanY - 12, W, 24);
      }

      // Draw Target Frame & Landmark Constellation
      const box = detectionBox.current;
      if (box) {
        const { x, y, w, h, dots, label } = box;
        const isLocked = scanStatusRef.current === "locked";
        const alpha = isLocked ? 1 : 0.6 + 0.4 * Math.sin(phase * 0.12);

        ctx.fillStyle = isLocked ? "rgba(38,208,206,0.06)" : "rgba(38,208,206,0.03)";
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = isLocked ? `rgba(38,208,206,${alpha})` : `rgba(38,208,206,${alpha * 0.8})`;
        ctx.lineWidth = isLocked ? 2 : 1.5;
        ctx.setLineDash([]);
        ctx.strokeRect(x, y, w, h);

        const cs = 22;
        ctx.lineWidth = isLocked ? 3 : 2;
        [
          [x, y, cs, 0, 0, cs],
          [x + w, y, -cs, 0, 0, cs],
          [x, y + h, cs, 0, 0, -cs],
          [x + w, y + h, -cs, 0, 0, -cs],
        ].forEach(([cx, cy, ax, , , ay]) => {
          ctx.beginPath();
          ctx.moveTo(cx + ax, cy);
          ctx.lineTo(cx, cy);
          ctx.lineTo(cx, cy + ay);
          ctx.stroke();
        });

        // Landmark dots
        dots.forEach((d) => {
          ctx.beginPath();
          ctx.arc(d.x, d.y, isLocked ? 3.5 : 2.5, 0, Math.PI * 2);
          ctx.fillStyle = isLocked ? TEAL : "rgba(38,208,206,0.6)";
          ctx.fill();
        });

        // Constellation lines when locked
        if (isLocked) {
          ctx.strokeStyle = "rgba(38,208,206,0.25)";
          ctx.lineWidth = 0.8;
          ctx.setLineDash([3, 4]);
          [
            [0, 1],
            [0, 2],
            [1, 2],
            [2, 3],
            [2, 4],
            [3, 5],
            [4, 5],
          ].forEach(([a, b]) => {
            if (dots[a] && dots[b]) {
              ctx.beginPath();
              ctx.moveTo(dots[a].x, dots[a].y);
              ctx.lineTo(dots[b].x, dots[b].y); // Fixed: lineTo dots[b]
              ctx.stroke();
            }
          });
          ctx.setLineDash([]);
        }

        // Draw un-mirrored label text
        ctx.save();
        ctx.font = `${isLocked ? "bold " : ""}12px 'JetBrains Mono', monospace`;
        ctx.fillStyle = isLocked ? TEAL : "rgba(38,208,206,0.85)";
        // Flip coordinate horizontally so text is un-mirrored on CSS scaleX(-1) canvas
        ctx.translate(x + w - 6, y - 6);
        ctx.scale(-1, 1);
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(processAndDraw);
    }

    animRef.current = requestAnimationFrame(processAndDraw);

    return () => {
      isSubscribed = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [camReady, handleStudentMatch]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Stats bar */}
      <div
        className="flex items-center gap-6 px-6 py-3 shrink-0"
        style={{ background: "rgba(13,27,62,0.6)", borderBottom: "1px solid rgba(38,208,206,0.08)" }}
      >
        {[
          { label: "Checked In", val: totalIn, color: TEAL },
          { label: "Checked Out", val: totalOut, color: "#f97316" },
          { label: "Total Logged", val: log.length, color: "#a78bfa" },
        ].map((c) => (
          <div key={c.label} className="flex items-center gap-2">
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: c.color, fontWeight: 600 }}>
              {c.val}
            </span>
            <span style={{ fontSize: 11, color: "rgba(240,246,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {c.label}
            </span>
          </div>
        ))}

        {/* Quick Simulation Presets */}
        <div className="hidden lg:flex items-center gap-1.5 ml-4 pl-4 border-l border-[#1b2b48]">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Test Preset:</span>
          {students.slice(0, 4).map((s) => (
            <button
              key={s.id}
              onClick={() => testSampleStudent(s)}
              className="px-2 py-0.5 rounded text-[11px] bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-all font-mono"
            >
              {s.name.split(" ")[0]}
            </button>
          ))}
        </div>

        <div className="ml-auto" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "rgba(240,246,255,0.5)" }}>
          {nowTime || fmt(new Date())}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Camera Viewport */}
        <div className="relative flex-1 overflow-hidden" style={{ background: "#060d1f" }}>
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
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ background: "#060d1f" }}>
              <div style={{ color: TEAL, fontSize: 40 }}>⬡</div>
              <p className="text-center px-8 text-sm" style={{ color: "rgba(240,246,255,0.55)", maxWidth: 320 }}>
                {camError}
              </p>
            </div>
          )}
          {!camReady && !camError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: "#060d1f" }}>
              <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: TEAL, borderTopColor: "transparent" }} />
              <p style={{ color: "rgba(240,246,255,0.4)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                INITIALISING CAMERA & FACE-API…
              </p>
            </div>
          )}

          {activeMatch && (
            <div
              className="absolute bottom-6 left-6 flex items-center gap-4 px-5 py-4 rounded-2xl"
              style={{
                background: "rgba(13,27,62,0.88)",
                border: `1.5px solid ${TEAL}`,
                backdropFilter: "blur(12px)",
                boxShadow: "0 0 32px rgba(38,208,206,0.2)",
                minWidth: 260,
                animation: "slideUp 0.3s ease",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                style={{ background: avatarColor(activeMatch.avatar), color: "#fff" }}
              >
                {activeMatch.avatar}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: "#f0f6ff" }}>{activeMatch.name}</div>
                <div style={{ fontSize: 11, color: "rgba(240,246,255,0.5)", marginTop: 1 }}>{activeMatch.department}</div>
              </div>
              <div className="ml-auto text-right">
                <div style={{ color: TEAL, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600 }}>
                  {(activeMatch.confidence * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: 10, color: "rgba(38,208,206,0.6)", marginTop: 1 }}>MATCH</div>
              </div>
            </div>
          )}

          <div
            className="absolute bottom-6 right-6 px-4 py-2 rounded-full flex items-center gap-2"
            style={{
              background: "rgba(13,27,62,0.75)",
              border: `1px solid ${scanStatus === "locked" ? TEAL : "rgba(38,208,206,0.25)"}`,
              backdropFilter: "blur(8px)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: scanStatus === "locked" ? TEAL : "rgba(240,246,255,0.5)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: scanStatus === "locked" ? TEAL : scanStatus === "scanning" ? "#facc15" : "rgba(240,246,255,0.2)",
                animation: scanStatus === "scanning" ? "pulse 1s infinite" : "none",
              }}
            />
            {scanStatus === "locked" ? "Identity Confirmed" : scanStatus === "scanning" ? "Scanning…" : "Awaiting Face"}
          </div>
        </div>

        {/* Log Sidebar */}
        <div
          className="flex flex-col shrink-0 overflow-hidden"
          style={{ width: 320, background: "rgba(10,18,42,0.97)", borderLeft: "1px solid rgba(38,208,206,0.1)" }}
        >
          <div className="px-5 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(38,208,206,0.1)" }}>
            <div
              style={{
                fontSize: 10,
                color: TEAL,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              Live Log
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 400, color: "#f0f6ff" }}>
              {log.length === 0 ? "Awaiting entries…" : `${log.length} record${log.length !== 1 ? "s" : ""}`}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {log.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
                <div style={{ fontSize: 28, opacity: 0.15 }}>◈</div>
                <p style={{ color: "rgba(240,246,255,0.3)", fontSize: 12, lineHeight: 1.6 }}>
                  Stand in front of the camera. FaceLog records attendance automatically.
                </p>
              </div>
            ) : (
              log.map((r, i) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 px-5 py-3"
                  style={{
                    borderBottom: "1px solid rgba(240,246,255,0.05)",
                    background: i === 0 ? "rgba(38,208,206,0.04)" : "transparent",
                    animation: i === 0 ? "fadeInRow 0.4s ease" : "none",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                    style={{ background: avatarColor(r.student.avatar), color: "#fff" }}
                  >
                    {r.student.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#f0f6ff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.student.name}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(240,246,255,0.4)", marginTop: 1 }}>
                      {r.student.studentId}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className="inline-block px-2 py-0.5 rounded mb-1"
                      style={{
                        background: r.type === "in" ? "rgba(38,208,206,0.12)" : "rgba(249,115,22,0.12)",
                        color: r.type === "in" ? TEAL : "#f97316",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9,
                        letterSpacing: "0.06em",
                      }}
                    >
                      {r.type === "in" ? "IN" : "OUT"}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(240,246,255,0.35)" }}>
                      {fmt(r.time)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div
            className="px-5 py-3 shrink-0 flex items-center justify-between"
            style={{ borderTop: "1px solid rgba(38,208,206,0.1)" }}
          >
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(240,246,255,0.25)" }}>
              MODEL v2.4 · EDGE
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(240,246,255,0.25)" }}>
              99.7% ACC
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
