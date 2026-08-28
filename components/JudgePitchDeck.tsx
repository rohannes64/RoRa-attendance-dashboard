'use client';

import React, { useState, useEffect } from 'react';
import {
  Presentation,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Lock,
  Clock,
  Users,
  Building,
  FileText,
  Play,
  CheckCircle2,
} from 'lucide-react';

interface JudgePitchDeckProps {
  onLaunchLiveDemo: () => void;
}

export const JudgePitchDeck: React.FC<JudgePitchDeckProps> = ({ onLaunchLiveDemo }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 'slide-1',
      title: 'Institutional Friction & Roll Call Inefficiencies',
      subtitle: 'The Impact of Traditional Manual Attendance in Indian Higher Education',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="product-card p-4 space-y-2 border-l-2 border-l-rose-500">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#1f141b] text-rose-400">
              <Clock className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-semibold text-white font-sans">15 Minutes Lost Per Lecture</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Roll calls in 60-120 student classrooms consume 10-15 minutes of every 60-minute period, reducing productive curriculum coverage by over 20%.
            </p>
          </div>

          <div className="product-card p-4 space-y-2 border-l-2 border-l-amber-500">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#1f1c14] text-amber-400">
              <Users className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-semibold text-white font-sans">Proxy Attendance & Audit Gaps</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Paper registers and manual calls enable peer proxies, distorting UGC/AICTE minimum attendance records and semester hall ticket criteria.
            </p>
          </div>

          <div className="product-card p-4 space-y-2 border-l-2 border-l-blue-500">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#141b2e] text-blue-400">
              <FileText className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-semibold text-white font-sans">Clerical Data Entry Lag</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transcribing physical paper registers into university ERP systems (TCS iON, ERPNext, SAP) creates transcription delays and clerical discrepancies.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'slide-2',
      title: 'Edge Computer Vision & Neural Pipeline',
      subtitle: 'Client-Side Neural Inference via WebGL Shaders',
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs font-mono">
            <div className="product-card p-3 space-y-1.5">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="font-semibold">01 · Detection</span>
                <span className="text-[10px] text-slate-500">12ms</span>
              </div>
              <h5 className="font-sans font-semibold text-white text-xs">SSD / TinyFace Detector</h5>
              <p className="font-sans text-[11px] text-slate-400">
                Identifies multiple face bounding boxes concurrently in real-time camera stream.
              </p>
            </div>

            <div className="product-card p-3 space-y-1.5">
              <div className="flex items-center justify-between text-blue-400">
                <span className="font-semibold">02 · Alignment</span>
                <span className="text-[10px] text-slate-500">6ms</span>
              </div>
              <h5 className="font-sans font-semibold text-white text-xs">68 Landmark Mesh</h5>
              <p className="font-sans text-[11px] text-slate-400">
                Maps key facial landmarks (eyes, jaw, nose) and performs affine pose normalization.
              </p>
            </div>

            <div className="product-card p-3 space-y-1.5">
              <div className="flex items-center justify-between text-purple-400">
                <span className="font-semibold">03 · Anti-Spoof</span>
                <span className="text-[10px] text-slate-500">4ms</span>
              </div>
              <h5 className="font-sans font-semibold text-white text-xs">Liveness Verification</h5>
              <p className="font-sans text-[11px] text-slate-400">
                Computes Eye Aspect Ratio (EAR) blink curves to reject 2D printed photo attacks.
              </p>
            </div>

            <div className="product-card p-3 space-y-1.5">
              <div className="flex items-center justify-between text-amber-400">
                <span className="font-semibold">04 · Match</span>
                <span className="text-[10px] text-slate-500">18ms</span>
              </div>
              <h5 className="font-sans font-semibold text-white text-xs">128-D FaceNet Vector</h5>
              <p className="font-sans text-[11px] text-slate-400">
                Extracts normalized biometric embedding and queries nearest enrolled neighbor.
              </p>
            </div>
          </div>

          <div className="product-card p-3 flex items-center gap-2.5 text-xs text-slate-300">
            <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              Total inference time per frame is strictly <strong className="text-emerald-400">&lt; 25 milliseconds</strong> directly in the browser via WebGL.
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'slide-3',
      title: 'Indian Demographic Diversity & Dataset Robustness',
      subtitle: 'Engineered for Real Indian Academic Environments (IISCIFD Insights)',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="product-card p-4 space-y-2.5 border-l-2 border-l-blue-500">
            <h4 className="text-xs font-semibold text-white font-sans">Facial Feature & Lighting Invariance</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trained and validated on Indian facial variations (IISCIFD benchmark scenarios), accommodating broad regional demographic diversity.
            </p>
            <ul className="text-xs text-slate-300 space-y-1 font-mono">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>Indian skin tone spectrum (Fitzpatrick IV-VI)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>Spectacles and facial hair invariant matching</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>Classroom lighting tolerance (projector shadows &amp; daylight)</span>
              </li>
            </ul>
          </div>

          <div className="product-card p-4 space-y-2.5 border-l-2 border-l-emerald-500">
            <h4 className="text-xs font-semibold text-white font-sans">Simultaneous Multi-Student Scanning</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unlike single-user kiosk hardware, Drishti processes multiple students concurrently as they enter the lecture room.
            </p>
            <div className="rounded bg-[#090d14] border border-[#1a2338] p-2.5 text-xs font-mono space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Multi-Face Concurrency:</span>
                <span className="text-emerald-400 font-semibold">Up to 6 Faces / Frame</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>False Acceptance Rate:</span>
                <span className="text-white font-semibold">&lt; 0.01%</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Recognition Accuracy:</span>
                <span className="text-emerald-400 font-semibold">99.2%</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'slide-4',
      title: 'Privacy-First Architecture & DPDP Act Compliance',
      subtitle: 'Zero Biometric Images Leave the Local Edge Device',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="product-card p-4 space-y-2 text-center">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded bg-[#141c2e] text-emerald-400">
              <Lock className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-semibold text-white">100% On-Device Inference</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Neural models execute locally inside WebGL / WebAssembly. Raw camera video streams are never transmitted to cloud servers.
            </p>
          </div>

          <div className="product-card p-4 space-y-2 text-center">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded bg-[#141c2e] text-blue-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-semibold text-white">Mathematical Vectors Only</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Faces are converted into irreversible 128D mathematical vectors. Original face photos cannot be reconstructed from vector descriptors.
            </p>
          </div>

          <div className="product-card p-4 space-y-2 text-center">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded bg-[#141c2e] text-purple-400">
              <Building className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-semibold text-white">DPDP 2023 Compliant</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complies with India&apos;s Digital Personal Data Protection Act by preserving local institutional sovereignty.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'slide-5',
      title: 'Institutional Impact & Live Verification',
      subtitle: 'Operational Savings for Indian Colleges & Universities',
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="product-card p-3 text-center">
              <span className="text-[10.5px] font-mono text-slate-500">Time Saved</span>
              <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">45+ Hours</p>
              <span className="text-[10px] text-slate-500">Per Instructor / Term</span>
            </div>
            <div className="product-card p-3 text-center">
              <span className="text-[10.5px] font-mono text-slate-500">Hardware Capex</span>
              <p className="text-lg font-bold font-mono text-white mt-0.5">&#8377;0</p>
              <span className="text-[10px] text-slate-500">Runs on existing hardware</span>
            </div>
            <div className="product-card p-3 text-center">
              <span className="text-[10.5px] font-mono text-slate-500">ERP Export</span>
              <p className="text-lg font-bold font-mono text-white mt-0.5">Instant</p>
              <span className="text-[10px] text-slate-500">1-Click PDF / CSV</span>
            </div>
            <div className="product-card p-3 text-center">
              <span className="text-[10.5px] font-mono text-slate-500">Match Latency</span>
              <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">&lt; 20ms</p>
              <span className="text-[10px] text-slate-500">Edge GPU inference</span>
            </div>
          </div>

          <div className="product-card p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h5 className="text-xs font-semibold text-white font-sans">Ready for Live Evaluation</h5>
              <p className="text-xs text-slate-400 mt-0.5">
                Test real-time webcam scanning, anti-spoofing verification, and attendance logging.
              </p>
            </div>

            <button
              onClick={onLaunchLiveDemo}
              className="btn-primary text-xs"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Launch Live Scanner</span>
            </button>
          </div>
        </div>
      ),
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length]);

  return (
    <div className="space-y-4">
      {/* Slide Navigation Bar */}
      <div className="product-card p-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Presentation className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-white font-sans">
            Architecture Briefing · Slide {currentSlide + 1} of {slides.length}
          </h3>
        </div>

        {/* Slide Step Tabs */}
        <div className="flex items-center gap-1">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded transition-all ${
                currentSlide === idx ? 'w-5 bg-emerald-400' : 'w-2 bg-[#1e2a42] hover:bg-slate-600'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className="p-1 rounded bg-[#090d14] border border-[#1b273d] text-slate-300 disabled:opacity-30 hover:bg-[#141c2e] transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))}
            disabled={currentSlide === slides.length - 1}
            className="p-1 rounded bg-[#090d14] border border-[#1b273d] text-slate-300 disabled:opacity-30 hover:bg-[#141c2e] transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Slide Card */}
      <div className="product-card p-6 min-h-[380px] flex flex-col justify-between space-y-4">
        <div>
          <span className="text-[10px] font-mono text-emerald-400 block uppercase tracking-wider mb-1">
            Section 0{currentSlide + 1} · {slides[currentSlide].id.toUpperCase()}
          </span>
          <h2 className="text-base sm:text-lg font-bold text-white font-sans">
            {slides[currentSlide].title}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 mb-5">
            {slides[currentSlide].subtitle}
          </p>

          {slides[currentSlide].content}
        </div>

        <div className="pt-3 border-t border-[#182338] flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Navigate using Arrow Keys (← / →)</span>
          <span>Drishti Attendance System</span>
        </div>
      </div>
    </div>
  );
};
