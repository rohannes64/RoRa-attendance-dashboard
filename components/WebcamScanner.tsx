'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Download,
  Users,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { StudentProfile, DetectionResult, AttendanceRecord } from '../types/attendance';
import {
  detectFacesInMedia,
  matchStudentDescriptor,
  drawAdvancedHUD,
} from '../lib/faceApi';
import { createLivenessState, evaluateLiveness, LivenessState } from '../lib/liveness';
import { playVerificationChime } from '../lib/audio';
import { ExportModal } from './ExportModal';

interface WebcamScannerProps {
  enrolledStudents: StudentProfile[];
  onMarkAttendance: (
    student: StudentProfile,
    confidence: number,
    distance: number,
    livenessScore: number,
    snapshotUrl?: string
  ) => void;
  recentAttendance: AttendanceRecord[];
  activeCourse: string;
  setActiveCourse: (course: string) => void;
  activeSection: string;
  setActiveSection: (sec: string) => void;
  isCameraActive: boolean;
  setIsCameraActive: (a: boolean) => void;
}

export const WebcamScanner: React.FC<WebcamScannerProps> = ({
  enrolledStudents,
  onMarkAttendance,
  recentAttendance,
  activeCourse,
  activeSection,
  isCameraActive,
  setIsCameraActive,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectorMode, setDetectorMode] = useState<'SSD' | 'TINY'>('TINY');
  const [showLandmarks, setShowLandmarks] = useState<boolean>(true);
  const [autoMarkEnabled, setAutoMarkEnabled] = useState<boolean>(true);
  const [cooldownSec, setCooldownSec] = useState<number>(30);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(70);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number>(0);

  // Last marked student toast
  const [lastMarkedStudent, setLastMarkedStudent] = useState<{
    name: string;
    rollNo: string;
    confidence: number;
    avatarUrl: string;
  } | null>(null);

  const cooldownMapRef = useRef<Map<string, number>>(new Map());
  const livenessStateRef = useRef<LivenessState>(createLivenessState());
  const isProcessingRef = useRef<boolean>(false);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(Date.now());
  const lastInferenceTimeRef = useRef<number>(0);

  // Start Webcam Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam is not accessible in this browser context');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      const msg = err instanceof Error ? err.message : 'Unable to open camera feed. Check permissions.';
      setCameraError(msg);
      setIsCameraActive(false);
    }
  };

  // Stop Webcam Stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Process Video Frame Loop
  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.paused || videoRef.current.ended) {
      if (isCameraActive) {
        animationFrameIdRef.current = requestAnimationFrame(processFrame);
      }
      return;
    }

    const nowTime = performance.now();
    if (nowTime - lastInferenceTimeRef.current < 75) {
      if (isCameraActive) {
        animationFrameIdRef.current = requestAnimationFrame(processFrame);
      }
      return;
    }

    if (isProcessingRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(processFrame);
      return;
    }

    lastInferenceTimeRef.current = nowTime;
    isProcessingRef.current = true;
    const startTime = performance.now();

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.videoWidth > 0 && video.videoHeight > 0) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const rawDetections = await detectFacesInMedia(video, {
          useTiny: detectorMode === 'TINY',
          scoreThreshold: 0.45,
        });

        const detectionResults: DetectionResult[] = [];

        for (const det of rawDetections) {
          const landmarks = det.landmarks.positions.map((p) => ({ x: p.x, y: p.y }));
          const descriptor = det.descriptor;

          const livenessRes = evaluateLiveness(landmarks, livenessStateRef.current);
          livenessStateRef.current = livenessRes.updatedState;

          const matchRes = matchStudentDescriptor(descriptor, enrolledStudents, 0.55);

          const result: DetectionResult = {
            id: Math.random().toString(),
            box: {
              x: det.detection.box.x,
              y: det.detection.box.y,
              width: det.detection.box.width,
              height: det.detection.box.height,
            },
            landmarks,
            matchedStudent: matchRes.matchedStudent,
            distance: matchRes.distance,
            confidence: matchRes.confidence,
            livenessScore: livenessRes.livenessScore,
            isLive: livenessRes.isLive,
            blinkDetected: livenessRes.blinkDetected,
          };

          detectionResults.push(result);

          if (autoMarkEnabled && result.matchedStudent && result.confidence >= confidenceThreshold) {
            const student = result.matchedStudent;
            const now = Date.now();
            const lastMarked = cooldownMapRef.current.get(student.id) || 0;

            if (now - lastMarked > cooldownSec * 1000) {
              cooldownMapRef.current.set(student.id, now);

              let snapshotUrl: string | undefined = undefined;
              try {
                const snapCanvas = document.createElement('canvas');
                snapCanvas.width = 160;
                snapCanvas.height = 160;
                const sCtx = snapCanvas.getContext('2d');
                if (sCtx) {
                  sCtx.drawImage(
                    video,
                    Math.max(0, result.box.x - 20),
                    Math.max(0, result.box.y - 20),
                    result.box.width + 40,
                    result.box.height + 40,
                    0,
                    0,
                    160,
                    160
                  );
                  snapshotUrl = snapCanvas.toDataURL('image/jpeg', 0.85);
                }
              } catch {
                // Ignore snapshot error
              }

              onMarkAttendance(student, result.confidence, result.distance, result.livenessScore, snapshotUrl);
              playVerificationChime();

              setLastMarkedStudent({
                name: student.name,
                rollNo: student.rollNo,
                confidence: result.confidence,
                avatarUrl: student.avatarUrl,
              });

              setTimeout(() => {
                setLastMarkedStudent(null);
              }, 3500);
            }
          }
        }

        drawAdvancedHUD(canvas, detectionResults, showLandmarks);
      }
    } catch (err) {
      console.warn('Frame processing exception:', err);
    } finally {
      const duration = performance.now() - startTime;
      setLatencyMs(Math.round(duration));

      const nowClock = Date.now();
      const delta = (nowClock - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = nowClock;
      if (delta > 0) {
        setFps(Math.min(60, Math.round(1 / delta)));
      }

      isProcessingRef.current = false;
      if (isCameraActive) {
        animationFrameIdRef.current = requestAnimationFrame(processFrame);
      }
    }
  }, [
    isCameraActive,
    detectorMode,
    showLandmarks,
    autoMarkEnabled,
    confidenceThreshold,
    cooldownSec,
    enrolledStudents,
    onMarkAttendance,
  ]);

  useEffect(() => {
    if (isCameraActive) {
      animationFrameIdRef.current = requestAnimationFrame(processFrame);
    }
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isCameraActive, processFrame]);

  // Test Student Preset Simulation
  const testSampleStudent = async (student: StudentProfile) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = student.avatarUrl;
    img.onload = async () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#060a14';
        ctx.fillRect(0, 0, 640, 480);
        ctx.drawImage(img, 120, 40, 400, 400);
      }

      const rawDetections = await detectFacesInMedia(img, {
        useTiny: detectorMode === 'TINY',
        scoreThreshold: 0.4,
      });

      const detectionResults: DetectionResult[] = rawDetections.map((det) => {
        const landmarks = det.landmarks.positions.map((p) => ({
          x: p.x * (400 / img.width) + 120,
          y: p.y * (400 / img.height) + 40,
        }));
        const matchRes = matchStudentDescriptor(det.descriptor, enrolledStudents, 0.55);

        if (matchRes.matchedStudent) {
          onMarkAttendance(matchRes.matchedStudent, matchRes.confidence, matchRes.distance, 96, student.avatarUrl);
          playVerificationChime();
          setLastMarkedStudent({
            name: matchRes.matchedStudent.name,
            rollNo: matchRes.matchedStudent.rollNo,
            confidence: matchRes.confidence,
            avatarUrl: matchRes.matchedStudent.avatarUrl,
          });
          setTimeout(() => setLastMarkedStudent(null), 3500);
        }

        return {
          id: Math.random().toString(),
          box: {
            x: det.detection.box.x * (400 / img.width) + 120,
            y: det.detection.box.y * (400 / img.height) + 40,
            width: det.detection.box.width * (400 / img.width),
            height: det.detection.box.height * (400 / img.height),
          },
          landmarks,
          matchedStudent: matchRes.matchedStudent,
          distance: matchRes.distance,
          confidence: matchRes.confidence,
          livenessScore: 96,
          isLive: true,
          blinkDetected: false,
        };
      });

      drawAdvancedHUD(canvas, detectionResults, showLandmarks);
    };
  };

  // Handle Photo File Test
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }

      const detections = await detectFacesInMedia(img, {
        useTiny: detectorMode === 'TINY',
        scoreThreshold: 0.4,
      });

      const detectionResults: DetectionResult[] = detections.map((det) => {
        const landmarks = det.landmarks.positions.map((p) => ({ x: p.x, y: p.y }));
        const matchRes = matchStudentDescriptor(det.descriptor, enrolledStudents, 0.55);

        if (matchRes.matchedStudent && matchRes.confidence >= confidenceThreshold) {
          onMarkAttendance(matchRes.matchedStudent, matchRes.confidence, matchRes.distance, 94);
          playVerificationChime();
        }

        return {
          id: Math.random().toString(),
          box: {
            x: det.detection.box.x,
            y: det.detection.box.y,
            width: det.detection.box.width,
            height: det.detection.box.height,
          },
          landmarks,
          matchedStudent: matchRes.matchedStudent,
          distance: matchRes.distance,
          confidence: matchRes.confidence,
          livenessScore: 94,
          isLive: true,
          blinkDetected: false,
        };
      });

      drawAdvancedHUD(canvas, detectionResults, showLandmarks);
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Dual-Tone Left Canvas (8 Cols) */}
      <div className="lg:col-span-8 p-6 flex flex-col justify-between overflow-y-auto bg-[#060a14]">
        {/* Main Viewport matching Figma */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#070c18] border border-[#142035] flex items-center justify-center shadow-xl">
          {/* Live Video */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`absolute inset-0 h-full w-full object-cover ${
              isCameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />

          {/* Canvas Overlay */}
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 h-full w-full object-cover pointer-events-none z-10 ${
              isCameraActive ? 'opacity-100' : 'opacity-100'
            }`}
          />

          {/* Standby View matching Figma Cyan Circular Indicator */}
          {!isCameraActive && (
            <div className="flex flex-col items-center justify-center p-8 text-center z-10 max-w-md w-full">
              {/* Cyan Circular Ring matching Figma */}
              <div className="relative flex items-center justify-center mb-4">
                <div className="h-14 w-14 rounded-full border-2 border-cyan-400/40 border-t-cyan-400 animate-spin" />
                <div className="absolute h-4 w-4 rounded-full bg-cyan-400 shadow-lg shadow-cyan-500/50" />
              </div>

              {/* Figma Text String */}
              <h3 className="text-sm font-semibold text-white mb-1 font-sans">
                Camera access required. Please allow camera permissions to start
              </h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed max-w-xs">
                Real-time edge facial recognition with liveness verification.
              </p>

              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={startCamera}
                  className="btn-primary"
                >
                  <Camera className="h-4 w-4" />
                  <span>Start Live Scanner</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload Image</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* 1-Click Simulation Presets */}
              <div className="w-full pt-4 border-t border-[#121c2e]">
                <span className="text-[10px] font-mono text-slate-500 block mb-2 uppercase tracking-wider">
                  Instant Test Presets
                </span>
                <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {enrolledStudents.slice(0, 5).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => testSampleStudent(s)}
                      title={`Simulate scan for ${s.name}`}
                      className="flex items-center gap-1.5 rounded-lg bg-[#091122] border border-[#192a48] hover:border-cyan-400/60 hover:bg-[#122240] px-2.5 py-1 text-xs text-slate-300 transition-all"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.avatarUrl}
                        alt={s.name}
                        className="h-4 w-4 rounded object-cover"
                      />
                      <span className="text-[11px] font-medium">{s.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {cameraError && (
                <div className="mt-3 flex items-center gap-2 rounded bg-rose-950/40 border border-rose-800/60 px-2.5 py-1.5 text-xs text-rose-300">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>
          )}

          {/* Active Top Bar */}
          {isCameraActive && (
            <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 rounded-md bg-[#03060d]/90 px-3 py-1 border border-[#142035] text-[11px] font-mono shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-slate-200">1080p WebGL Stream ({fps} FPS · {latencyMs}ms)</span>
              </div>

              <button
                onClick={stopCamera}
                className="pointer-events-auto rounded-md bg-[#1e1217] hover:bg-[#2e1a23] text-rose-300 border border-rose-800/50 px-2.5 py-1 text-xs font-medium transition-colors"
              >
                Stop Camera
              </button>
            </div>
          )}

          {/* Verified Student Toast */}
          {lastMarkedStudent && (
            <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between rounded-lg bg-[#050c18]/95 border border-cyan-500/50 p-3 shadow-2xl animate-in fade-in duration-150">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lastMarkedStudent.avatarUrl}
                  alt={lastMarkedStudent.name}
                  className="h-9 w-9 rounded-lg object-cover border border-[#1e2a42]"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white">{lastMarkedStudent.name}</span>
                    <span className="chip-present text-[9px]">VERIFIED</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400">
                    {lastMarkedStudent.rollNo} · {lastMarkedStudent.confidence}% Match
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono">
                <CheckCircle2 className="h-4 w-4" />
                <span>Marked Present</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick 1-Click Recognition Simulation Strip */}
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-[#070d18] border border-[#142035] p-2">
          <span className="text-[10.5px] font-mono text-cyan-400 font-semibold uppercase tracking-wider shrink-0">
            ⚡ Quick Scan Simulation:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {enrolledStudents.slice(0, 6).map((s) => (
              <button
                key={s.id}
                onClick={() => testSampleStudent(s)}
                title={`Simulate scan for ${s.name}`}
                className="flex items-center gap-1.5 rounded bg-[#0b1424] hover:bg-[#122240] border border-[#1a2d4e] hover:border-cyan-400 px-2 py-1 text-xs text-slate-200 transition-all shrink-0 active:scale-95"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.avatarUrl}
                  alt={s.name}
                  className="h-4 w-4 rounded-full object-cover"
                />
                <span className="text-[11px] font-medium">{s.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="mt-2.5 studio-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono text-[11px]">Detector:</span>
              <div className="flex rounded bg-[#03060d] p-0.5 border border-[#142035]">
                <button
                  onClick={() => setDetectorMode('TINY')}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                    detectorMode === 'TINY' ? 'bg-[#0f1d35] text-cyan-300 border border-cyan-500/30' : 'text-slate-400'
                  }`}
                >
                  TinyFace (Low Latency)
                </button>
                <button
                  onClick={() => setDetectorMode('SSD')}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                    detectorMode === 'SSD' ? 'bg-[#0f1d35] text-cyan-300 border border-cyan-500/30' : 'text-slate-400'
                  }`}
                >
                  SSD MobileNet
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs">
              <input
                type="checkbox"
                checked={showLandmarks}
                onChange={(e) => setShowLandmarks(e.target.checked)}
                className="rounded border-[#1e2a42] bg-[#03060d] text-cyan-500"
              />
              <span>68 Landmarks</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs">
              <input
                type="checkbox"
                checked={autoMarkEnabled}
                onChange={(e) => setAutoMarkEnabled(e.target.checked)}
                className="rounded border-[#1e2a42] bg-[#03060d] text-cyan-500"
              />
              <span>Auto-Log</span>
            </label>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Threshold: {confidenceThreshold}%</span>
            <input
              type="range"
              min="60"
              max="90"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              className="w-18 accent-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Dual-Tone Right Panel (4 Cols) matching Figma 'Live Log' */}
      <div className="lg:col-span-4 border-l border-[#101a2d] bg-[#03060d] p-5 flex flex-col justify-between h-full overflow-hidden">
        {/* Header */}
        <div className="pb-3 border-b border-[#101a2d] flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white font-sans">Live Log</h4>
            <p className="text-[11px] text-slate-500">Real-time attendance stream</p>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 tabular-nums">
            {recentAttendance.length} Checked In
          </span>
        </div>

        {/* Live List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1">
          {recentAttendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500">
              <Clock className="h-8 w-8 text-slate-700 mb-2" />
              <p className="text-xs font-medium text-slate-400">No verified check-ins yet</p>
              <p className="text-[11px] text-slate-600 mt-1 max-w-xs">
                Recognized student records will populate here automatically.
              </p>
            </div>
          ) : (
            recentAttendance.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between rounded-lg p-2.5 bg-[#060c18] border border-[#142238] hover:border-cyan-500/40 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={record.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={record.studentName}
                    className="h-8 w-8 rounded-lg object-cover border border-[#1e2a42] shrink-0"
                  />
                  <div className="min-w-0">
                    <h5 className="text-xs font-semibold text-white truncate leading-tight">
                      {record.studentName}
                    </h5>
                    <p className="text-[10.5px] font-mono text-slate-400 truncate">
                      {record.rollNo} · {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>
                </div>

                <span className="chip-present text-[10px] tabular-nums shrink-0">
                  {record.confidence}% Match
                </span>
              </div>
            ))
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-3 border-t border-[#101a2d]">
          <button
            onClick={() => setIsExportOpen(true)}
            className="w-full btn-secondary text-xs"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span>Export Attendance Records (PDF / CSV)</span>
          </button>
        </div>
      </div>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        attendanceRecords={recentAttendance}
        allStudents={enrolledStudents}
        courseCode={activeCourse}
        courseName={activeCourse}
        section={activeSection}
      />
    </div>
  );
};
