import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  loadFaceApiModels,
  getFaceApi,
  calculateCalibratedConfidence,
  applyNMS,
  createFaceMatcher,
} from "../../lib/faceApi";
import { MultiFaceTracker } from "../../lib/faceTracker";

const AMBER = "#E8943A";
const TERRACOTTA = "#C4622D";

function avatarColor(initials) {
  const hues = [25, 30, 35, 20, 40, 28, 32];
  return `hsl(${hues[(initials?.charCodeAt(0) || 0) % hues.length]}, 65%, 42%)`;
}

function playBeepSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {}
}

export default function LiveScanner({ students = [], onLog, log = [], totalIn = 0, totalOut = 0 }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(0);
  const trackerRef = useRef(new MultiFaceTracker(0.3, 5, 15000));
  const scanPhaseRef = useRef(0);

  const [camReady, setCamReady] = useState(false);
  const [camError, setCamError] = useState(null);
  const [activeMatch, setActiveMatch] = useState(null);
  const [scanStatus, setScanStatus] = useState("idle");
  const [nowTime, setNowTime] = useState("");

  const streamRef = useRef(null);

  useEffect(() => {
    const updateTime = () => setNowTime(new Date().toLocaleTimeString("en-GB"));
    updateTime();
    const t = setInterval(updateTime, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    loadFaceApiModels().catch(() => setCamError("Failed to load Face-API neural models."));
  }, []);

  const startCamera = useCallback(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } })
      .then((s) => {
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setCamReady(true);
          };
        }
      })
      .catch(() => setCamError("Camera permission denied."));
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(animRef.current);
    };
  }, [startCamera]);

  useEffect(() => {
    if (!camReady) return;
    let isSubscribed = true;

    async function detectLoop() {
      const vid = videoRef.current;
      const canvas = canvasRef.current;
      if (!vid || !canvas || vid.paused || vid.ended) {
        if (isSubscribed) animRef.current = requestAnimationFrame(detectLoop);
        return;
      }

      const W = vid.videoWidth || 640;
      const H = vid.videoHeight || 480;
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, W, H);
      scanPhaseRef.current = (scanPhaseRef.current + 1) % 360;

      try {
        const faceapi = await getFaceApi();
        const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.45 });
        const rawDetections = await faceapi
          .detectAllFaces(vid, options)
          .withFaceLandmarks()
          .withFaceDescriptors();

        const detections = applyNMS(rawDetections, 0.35);
        const matcher = createFaceMatcher(students, 0.48);

        const detectionInputs = detections.map((det) => {
          const bx = det.detection.box.x;
          const by = det.detection.box.y;
          const bw = det.detection.box.width;
          const bh = det.detection.box.height;

          const lmarks = det.landmarks?.positions || [];
          const dots = [
            lmarks[36] || { x: bx + bw * 0.3, y: by + bh * 0.35 },
            lmarks[45] || { x: bx + bw * 0.7, y: by + bh * 0.35 },
            lmarks[30] || { x: bx + bw * 0.5, y: by + bh * 0.5 },
            lmarks[48] || { x: bx + bw * 0.35, y: by + bh * 0.7 },
            lmarks[54] || { x: bx + bw * 0.65, y: by + bh * 0.7 },
            lmarks[8] || { x: bx + bw * 0.5, y: by + bh * 0.9 },
          ];

          let bestStudent = null;
          let bestDist = 1.0;

          if (det.descriptor) {
            for (const st of students) {
              if (st.descriptor && st.descriptor.length === 128) {
                let dist = 0;
                for (let i = 0; i < 128; i++) {
                  const diff = det.descriptor[i] - st.descriptor[i];
                  dist += diff * diff;
                }
                dist = Math.sqrt(dist);
                if (dist < bestDist) {
                  bestDist = dist;
                  bestStudent = st;
                }
              }
            }
          }

          const conf = calculateCalibratedConfidence(bestDist);

          return {
            box: { x: bx, y: by, width: bw, height: bh },
            dots,
            matchedStudent: bestStudent,
            confidence: conf,
            distance: bestDist,
          };
        });

        const { tracks: activeTracks, newlyVerified } = trackerRef.current.update(detectionInputs);

        if (activeTracks.length === 0) {
          setScanStatus("idle");
        } else if (activeTracks.some((t) => t.isLocked)) {
          setScanStatus("locked");
        } else {
          setScanStatus("scanning");
        }

        newlyVerified.forEach(({ student, confidence }) => {
          playBeepSound();
          setActiveMatch({
            name: student.name,
            department: student.department || "Computer Science",
            avatar: student.avatar || student.name.slice(0, 2).toUpperCase(),
            confidence,
          });

          onLog({
            id: `log-${Date.now()}`,
            student,
            time: new Date(),
            type: "in",
            confidence,
          });

          setTimeout(() => setActiveMatch(null), 4000);
        });

        activeTracks.forEach((track) => {
          const { box, isLocked, matchedStudent, label } = track;
          const { x, y, width: w, height: h } = box;

          let strokeColor = isLocked ? TERRACOTTA : AMBER;
          let labelText = isLocked && matchedStudent ? matchedStudent.name.toUpperCase() : label;
          let subText = isLocked && matchedStudent ? `ID: ${matchedStudent.studentId || matchedStudent.id}` : "68 Landmarks Mesh";

          // Render Corner HUD Brackets
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = isLocked ? 3 : 2;
          const cornerLen = Math.min(w, h) * 0.22;

          [
            [x, y, cornerLen, 0, 0, cornerLen],
            [x + w, y, -cornerLen, 0, 0, cornerLen],
            [x, y + h, cornerLen, 0, 0, -cornerLen],
            [x + w, y + h, -cornerLen, 0, 0, -cornerLen],
          ].forEach(([cx, cy, ax, , , ay]) => {
            ctx.beginPath();
            ctx.moveTo(cx + ax, cy);
            ctx.lineTo(cx, cy);
            ctx.lineTo(cx, cy + ay);
            ctx.stroke();
          });

          // Text HUD Label
          ctx.save();
          ctx.translate(x + w - 6, Math.max(20, y - 6));
          ctx.scale(-1, 1);
          ctx.fillStyle = strokeColor;
          ctx.font = "bold 12px 'JetBrains Mono', monospace";
          ctx.fillText(labelText, 0, 0);
          ctx.fillStyle = "rgba(240,226,200,0.7)";
          ctx.font = "10px 'JetBrains Mono', monospace";
          ctx.fillText(subText, 0, 14);
          ctx.restore();
        });

      } catch (err) {}

      if (isSubscribed) animRef.current = requestAnimationFrame(detectLoop);
    }

    animRef.current = requestAnimationFrame(detectLoop);
    return () => {
      isSubscribed = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [camReady, students, onLog]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Stats Header Bar */}
      <div className="flex items-center gap-6 px-6 py-3 shrink-0 bg-[#1E1610] border-b border-[#2A1F13]">
        {[
          { label: "Checked In", val: totalIn, color: AMBER },
          { label: "Checked Out", val: totalOut, color: TERRACOTTA },
          { label: "Total Logged", val: log.length, color: "#CD7F32" },
        ].map((c) => (
          <div key={c.label} className="flex items-center gap-2">
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: c.color, fontWeight: 600 }}>
              {c.val}
            </span>
            <span style={{ fontSize: 11, color: "rgba(240,226,200,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {c.label}
            </span>
          </div>
        ))}
        <div className="ml-auto font-mono text-xs text-[#A89070]">{nowTime}</div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Camera Stream */}
        <div className="relative flex-1 overflow-hidden bg-[#0A0704]">
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
              <span className="text-xs text-[#A89070] font-mono">INITIALISING CAMERA & FACE-API…</span>
            </div>
          )}

          {activeMatch && (
            <div className="absolute bottom-6 left-6 flex items-center gap-4 px-5 py-4 rounded-2xl bg-[#1E1610]/95 border-2 border-[#E8943A] backdrop-blur shadow-2xl animate-fade-in-up min-w-[260px]">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
                style={{ background: avatarColor(activeMatch.avatar) }}
              >
                {activeMatch.avatar}
              </div>
              <div>
                <div className="font-semibold text-sm text-[#F0E2C8]">{activeMatch.name}</div>
                <div className="text-xs text-[#A89070]">{activeMatch.department}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-[#E8943A] font-mono text-xs font-bold">{(activeMatch.confidence * 100).toFixed(1)}%</div>
                <div className="text-[10px] text-[#C4622D] uppercase font-bold">MATCH</div>
              </div>
            </div>
          )}
        </div>

        {/* Live Logs Sidebar */}
        <div className="w-80 bg-[#1E1610] border-l border-[#2A1F13] flex flex-col shrink-0 overflow-hidden">
          <div className="px-5 py-4 shrink-0 border-b border-[#2A1F13]">
            <div className="text-[10px] uppercase tracking-widest text-[#E8943A] font-mono mb-1">Live Log</div>
            <div className="font-serif text-lg text-[#F0E2C8]">
              {log.length === 0 ? "Awaiting entries…" : `${log.length} records`}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#2A1F13]">
            {log.map((r) => (
              <div key={r.id} className="p-3.5 flex items-center gap-3 hover:bg-[#251C15] transition-colors">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                  style={{ background: avatarColor(r.student?.avatar) }}
                >
                  {r.student?.avatar || r.student?.name?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[#F0E2C8] truncate">{r.student?.name}</div>
                  <div className="text-[10px] text-[#A89070] font-mono">{r.student?.studentId}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#C4622D]/20 text-[#E8943A]">
                  IN
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
