'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import type { StudentProfile } from '../types/attendance';
import { detectFacesInMedia, extractSingleDescriptor } from '../lib/faceApi';
import { playVerificationChime } from '../lib/audio';

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnrollStudent: (student: StudentProfile) => void;
}

type CaptureStep = 'CENTER' | 'LEFT' | 'RIGHT' | 'DONE';

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
  isOpen,
  onClose,
  onEnrollStudent,
}) => {
  const [activeMode, setActiveMode] = useState<'CAMERA' | 'UPLOAD'>('CAMERA');

  // Form State
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [branch, setBranch] = useState('Computer Science & AI');
  const [semester, setSemester] = useState<number>(6);
  const [section, setSection] = useState('A');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');

  // Biometrics State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [capturedDescriptors, setCapturedDescriptors] = useState<number[][]>([]);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<CaptureStep>('CENTER');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !rollNo) {
      const rand = Math.floor(100 + Math.random() * 900);
      setRollNo(`2024-CS-0${rand}`);
    }
  }, [isOpen, rollNo]);

  const startEnrollmentCamera = async () => {
    setExtractionError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera stream not supported in this browser');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraRunning(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to access camera';
      setExtractionError(msg);
      setIsCameraRunning(false);
    }
  };

  const stopEnrollmentCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraRunning(false);
  };

  useEffect(() => {
    if (isOpen && activeMode === 'CAMERA') {
      startEnrollmentCamera();
    } else {
      stopEnrollmentCamera();
    }
    return () => {
      stopEnrollmentCamera();
    };
  }, [isOpen, activeMode]);

  const handleCaptureSnapshot = async () => {
    if (!videoRef.current) return;
    setIsExtracting(true);
    setExtractionError(null);

    await new Promise((resolve) => setTimeout(resolve, 30));

    try {
      const video = videoRef.current;
      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = 480;
      snapCanvas.height = 360;
      const ctx = snapCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, 480, 360);
      }

      const res = await extractSingleDescriptor(snapCanvas);

      if (!res.descriptor) {
        throw new Error('No face detected clearly. Please align your face inside the target frame.');
      }

      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = 240;
      previewCanvas.height = 240;
      const pCtx = previewCanvas.getContext('2d');
      if (pCtx) {
        if (res.box) {
          pCtx.drawImage(
            snapCanvas,
            Math.max(0, res.box.x - 20),
            Math.max(0, res.box.y - 20),
            res.box.width + 40,
            res.box.height + 40,
            0,
            0,
            240,
            240
          );
        } else {
          pCtx.drawImage(snapCanvas, 0, 0, 240, 240);
        }
        setCapturedPhotoUrl(previewCanvas.toDataURL('image/jpeg', 0.85));
      }

      const updated = [...capturedDescriptors, res.descriptor];
      setCapturedDescriptors(updated);

      if (currentStep === 'CENTER') {
        setCurrentStep('LEFT');
      } else if (currentStep === 'LEFT') {
        setCurrentStep('RIGHT');
      } else {
        setCurrentStep('DONE');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error extracting face descriptor';
      setExtractionError(msg);
    } finally {
      setIsExtracting(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setExtractionError(null);

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      try {
        const res = await extractSingleDescriptor(img);
        if (!res.descriptor) {
          throw new Error('No face detected in the uploaded photo. Please upload a clear frontal portrait.');
        }

        setCapturedDescriptors([res.descriptor]);
        setCapturedPhotoUrl(img.src);
        setCurrentStep('DONE');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Face extraction failed';
        setExtractionError(msg);
      } finally {
        setIsExtracting(false);
      }
    };
  };

  const handleResetCapture = () => {
    setCapturedDescriptors([]);
    setCapturedPhotoUrl(null);
    setCurrentStep('CENTER');
    setExtractionError(null);
    if (activeMode === 'CAMERA') {
      startEnrollmentCamera();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setExtractionError('Please enter the student full name');
      return;
    }
    if (!rollNo.trim()) {
      setExtractionError('Please enter a valid roll number');
      return;
    }
    if (capturedDescriptors.length === 0) {
      setExtractionError('Biometric facial descriptor is required. Please capture or upload a face portrait.');
      return;
    }

    const compositeDescriptor: number[] = new Array(128).fill(0);
    for (let i = 0; i < 128; i++) {
      let sum = 0;
      for (const d of capturedDescriptors) {
        sum += d[i];
      }
      compositeDescriptor[i] = sum / capturedDescriptors.length;
    }

    const norm = Math.sqrt(compositeDescriptor.reduce((acc, v) => acc + v * v, 0));
    const normalizedDescriptor = compositeDescriptor.map((v) => Number((v / (norm || 1)).toFixed(6)));

    const newStudent: StudentProfile = {
      id: `std-custom-${Date.now()}`,
      rollNo: rollNo.trim().toUpperCase(),
      name: name.trim(),
      branch,
      semester,
      section,
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@iit.ac.in`,
      gender,
      avatarUrl:
        capturedPhotoUrl ||
        (gender === 'Female'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'),
      descriptor: normalizedDescriptor,
      enrolledAt: new Date().toISOString(),
      totalSessions: 1,
      attendedSessions: 1,
    };

    onEnrollStudent(newStudent);
    playVerificationChime();
    handleResetCapture();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl p-6 rounded-2xl bg-[#090f1d] border border-[#1d2f4e] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto z-50 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#182844]">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-cyan-400" />
            <div>
              <h3 className="text-sm font-semibold text-white font-sans">
                Student Biometric Enrollment
              </h3>
              <p className="text-[11px] text-slate-400">
                Register a new student with a 128-dimensional FaceNet embedding.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Biometrics Capture Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono text-slate-400">
              1. Face Vector Extraction
            </label>
            <div className="flex rounded bg-[#090d14] p-0.5 border border-[#1b273d] text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  setActiveMode('CAMERA');
                  handleResetCapture();
                }}
                className={`px-2.5 py-0.5 rounded text-[11px] transition-all ${
                  activeMode === 'CAMERA' ? 'bg-[#182338] text-white border border-[#283754]' : 'text-slate-400'
                }`}
              >
                Multi-Angle Camera
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMode('UPLOAD');
                  handleResetCapture();
                }}
                className={`px-2.5 py-0.5 rounded text-[11px] transition-all ${
                  activeMode === 'UPLOAD' ? 'bg-[#182338] text-white border border-[#283754]' : 'text-slate-400'
                }`}
              >
                Photo Upload
              </button>
            </div>
          </div>

          {activeMode === 'CAMERA' ? (
            <div className="rounded-md bg-[#090d14] border border-[#1b273d] p-3 text-center space-y-2.5">
              <div className="relative mx-auto aspect-video max-w-xs rounded overflow-hidden bg-[#060910] border border-[#1e2a42] flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`h-full w-full object-cover ${
                    capturedPhotoUrl && currentStep === 'DONE' ? 'hidden' : 'block'
                  }`}
                />

                {capturedPhotoUrl && currentStep === 'DONE' && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={capturedPhotoUrl}
                    alt="Captured portrait"
                    className="h-full w-full object-cover"
                  />
                )}

                {currentStep !== 'DONE' && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="h-28 w-22 rounded-full border border-dashed border-emerald-500/70" />
                  </div>
                )}
              </div>

              {/* Step indicator */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-slate-400">
                <span className={currentStep === 'CENTER' ? 'text-emerald-400 font-semibold' : ''}>1. Front</span>
                <ChevronRight className="h-3 w-3 text-slate-600" />
                <span className={currentStep === 'LEFT' ? 'text-emerald-400 font-semibold' : ''}>2. Left Tilt</span>
                <ChevronRight className="h-3 w-3 text-slate-600" />
                <span className={currentStep === 'RIGHT' ? 'text-emerald-400 font-semibold' : ''}>3. Right Tilt</span>
              </div>

              <div className="flex items-center justify-center gap-2">
                {currentStep !== 'DONE' ? (
                  <button
                    type="button"
                    onClick={handleCaptureSnapshot}
                    disabled={isExtracting}
                    className="btn-primary"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>
                      {isExtracting ? 'Extracting...' : `Capture Angle (${capturedDescriptors.length + 1}/3)`}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Descriptor Extracted (3 Angles)</span>
                    <button
                      type="button"
                      onClick={handleResetCapture}
                      className="ml-2 text-xs text-slate-400 hover:text-white underline"
                    >
                      Retake
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-[#090d14] border border-[#1b273d] p-4 text-center space-y-2">
              {capturedPhotoUrl ? (
                <div className="flex flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={capturedPhotoUrl}
                    alt="Uploaded avatar"
                    className="h-20 w-20 rounded object-cover border border-[#1e2a42]"
                  />
                  <span className="text-xs font-mono text-emerald-400">
                    ✓ Face Descriptor Ready
                  </span>
                  <button
                    type="button"
                    onClick={handleResetCapture}
                    className="text-xs text-slate-400 hover:text-white underline"
                  >
                    Upload Different Image
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-slate-300 font-medium">Upload Student Portrait</p>
                  <p className="text-[11px] text-slate-500 mb-2">Supports JPG and PNG formats</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExtracting}
                    className="btn-secondary"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>{isExtracting ? 'Processing...' : 'Browse Image File'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          )}

          {extractionError && (
            <div className="flex items-center gap-2 rounded bg-rose-950/40 border border-rose-800/60 p-2 text-xs text-rose-300">
              <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
              <span>{extractionError}</span>
            </div>
          )}
        </div>

        {/* Student Metadata Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <label className="text-xs font-mono text-slate-400 block">
            2. Academic Details
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Aarav Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md bg-[#090d14] border border-[#1e2a42] px-2.5 py-1.5 text-white focus:outline-none focus:border-[#3b82f6]"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">Roll Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. 2024-CS-0125"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                className="w-full rounded-md bg-[#090d14] border border-[#1e2a42] px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-[#3b82f6]"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">Department</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full rounded-md bg-[#090d14] border border-[#1e2a42] px-2.5 py-1.5 text-white focus:outline-none focus:border-[#3b82f6]"
              >
                <option value="Computer Science & AI">Computer Science & AI</option>
                <option value="Artificial Intelligence & Data Science">AI & Data Science</option>
                <option value="Electronics & VLSI Engineering">Electronics & VLSI</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Mechanical & Mechatronics">Mechanical & Mechatronics</option>
                <option value="Electrical & Computing">Electrical & Computing</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1 text-[11px]">Semester</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full rounded-md bg-[#090d14] border border-[#1e2a42] px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-[#3b82f6]"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 text-[11px]">Section</label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value.toUpperCase())}
                  className="w-full rounded-md bg-[#090d14] border border-[#1e2a42] px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-[#3b82f6]"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">Email</label>
              <input
                type="email"
                placeholder="student@iit.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md bg-[#090d14] border border-[#1e2a42] px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-[#3b82f6]"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | 'Other')}
                className="w-full rounded-md bg-[#090d14] border border-[#1e2a42] px-2.5 py-1.5 text-white focus:outline-none focus:border-[#3b82f6]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1e2a42]">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={capturedDescriptors.length === 0}
              className="btn-primary"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Complete Enrollment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
