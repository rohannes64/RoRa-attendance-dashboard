import React, { useState, useRef, useEffect, useCallback } from "react";
import { extractSingleDescriptor } from "../../lib/faceApi";

export default function EnrollWizard({ onEnroll, enrolled = [] }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", studentId: "", department: "Computer Science", year: "Year 3" });
  const [captures, setCaptures] = useState({ front: null, left: null, right: null });
  const [descriptors, setDescriptors] = useState([]);

  const [cameraActive, setCameraActive] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState(null);

  const currentAngle = step === 2 ? "front" : step === 3 ? "left" : step === 4 ? "right" : null;

  const startCamera = useCallback(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } })
      .then((s) => {
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
          setCameraActive(true);
        }
      })
      .catch(() => setMessage("Camera permission denied."));
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (step >= 2 && step <= 4) startCamera();
    else stopCamera();

    return () => stopCamera();
  }, [step, startCamera, stopCamera]);

  const handleCaptureAngle = async () => {
    if (!videoRef.current || !currentAngle) return;
    setScanning(true);
    setMessage(null);

    const vid = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = vid.videoWidth || 640;
    canvas.height = vid.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.scale(-1, 1);
    ctx.drawImage(vid, -canvas.width, 0, canvas.width, canvas.height);
    const photoUrl = canvas.toDataURL("image/jpeg", 0.85);

    try {
      const { descriptor } = await extractSingleDescriptor(vid);
      if (!descriptor) {
        setMessage("No face detected! Center your face and retry.");
        setScanning(false);
        return;
      }

      setCaptures((prev) => ({ ...prev, [currentAngle]: photoUrl }));
      setDescriptors((prev) => [...prev, descriptor]);

      if (step < 4) {
        setStep((s) => s + 1);
      } else {
        stopCamera();
        setStep(5);
      }
    } catch (err) {
      setMessage("Error extracting biometric embedding.");
    } finally {
      setScanning(false);
    }
  };

  const triggerCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          handleCaptureAngle();
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    if (descriptors.length === 0) return;

    // Calculate mean 128D descriptor across captured angles
    const meanDescriptor = new Array(128).fill(0);
    for (let i = 0; i < 128; i++) {
      let sum = 0;
      for (const d of descriptors) sum += d[i];
      meanDescriptor[i] = sum / descriptors.length;
    }

    const initials = form.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    const newStudent = {
      id: `custom-${Date.now()}`,
      customId: `custom-${Date.now()}`,
      name: form.name,
      studentId: form.studentId || `STU-${Date.now().toString().slice(-4)}`,
      department: form.department,
      year: form.year,
      avatar: initials || "ST",
      enrolledDate: new Date().toISOString().slice(0, 10),
      photo: captures.front,
      descriptor: meanDescriptor,
    };

    onEnroll(newStudent);
    setStep(6);
  };

  return (
    <div className="space-y-6">
      {/* Wizard Steps Header */}
      <div className="flex items-center justify-between border-b border-[#2A1F13] pb-4">
        {[
          { num: 1, label: "Info" },
          { num: 2, label: "Front Profile" },
          { num: 3, label: "Left Profile" },
          { num: 4, label: "Right Profile" },
          { num: 5, label: "Review" },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                step === s.num
                  ? "bg-[#C4622D] text-[#F0E2C8]"
                  : step > s.num
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                  : "bg-[#140E07] text-[#A89070] border border-[#2A1F13]"
              }`}
            >
              {step > s.num ? "✓" : s.num}
            </span>
            <span className={`text-xs hidden sm:inline ${step === s.num ? "text-[#F0E2C8] font-medium" : "text-[#A89070]"}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {message && <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-400 text-xs">{message}</div>}

      {/* Step 1: Info Form */}
      {step === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStep(2);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">Full Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Maya Lin"
              className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-3.5 py-2.5 text-sm text-[#F0E2C8] focus:outline-none focus:border-[#E8943A]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">Student / Roll ID</label>
              <input
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                placeholder="STU-2420"
                className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-3.5 py-2.5 text-sm font-mono text-[#F0E2C8] focus:outline-none focus:border-[#E8943A]"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A89070] mb-1 font-semibold">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full bg-[#140E07] border border-[#2A1F13] rounded-xl px-3.5 py-2.5 text-sm text-[#F0E2C8] focus:outline-none focus:border-[#E8943A]"
              >
                <option value="Computer Science" className="bg-[#140E07]">Computer Science</option>
                <option value="Data Science" className="bg-[#140E07]">Data Science</option>
                <option value="AI & Robotics" className="bg-[#140E07]">AI & Robotics</option>
                <option value="Electrical Eng." className="bg-[#140E07]">Electrical Eng.</option>
                <option value="Mathematics" className="bg-[#140E07]">Mathematics</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold shadow-md transition-all mt-2"
          >
            Continue to 3-Angle Capture →
          </button>
        </form>
      )}

      {/* Steps 2-4: Camera Angle Captures */}
      {step >= 2 && step <= 4 && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-serif text-lg text-[#F0E2C8]">
              Step {step - 1} of 3: {step === 2 ? "Front Profile" : step === 3 ? "Left Profile" : "Right Profile"}
            </h3>
            <p className="text-xs text-[#A89070]">
              {step === 2 ? "Look directly at the camera" : step === 3 ? "Turn head slightly to your LEFT" : "Turn head slightly to your RIGHT"}
            </p>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-[#0A0704] border border-[#2A1F13] h-64 flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted style={{ transform: "scaleX(-1)" }} />

            <div className="absolute inset-0 border-2 border-dashed border-[#E8943A]/50 rounded-full m-8 pointer-events-none" />

            {countdown !== null && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-6xl font-serif text-[#E8943A] animate-pulse">
                {countdown}
              </div>
            )}

            {scanning && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-sm font-mono text-[#E8943A]">
                Extracting 128D Biometric Features…
              </div>
            )}
          </div>

          <button
            onClick={triggerCountdown}
            disabled={scanning || countdown !== null}
            className="w-full py-3 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold shadow-md disabled:opacity-50"
          >
            📸 Capture {step === 2 ? "Front" : step === 3 ? "Left" : "Right"} Angle
          </button>
        </div>
      )}

      {/* Step 5: Final Review & Submit */}
      {step === 5 && (
        <form onSubmit={handleFinalSubmit} className="space-y-4">
          <div className="text-center">
            <h3 className="font-serif text-xl text-[#F0E2C8] mb-1">Review Biometric Profile</h3>
            <p className="text-xs text-[#A89070]">3 angles captured • 128D FaceNet embedding calculated</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Front", img: captures.front },
              { label: "Left", img: captures.left },
              { label: "Right", img: captures.right },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-[#2A1F13] overflow-hidden bg-[#140E07] text-center p-2">
                <img src={c.img} alt={c.label} className="w-full h-24 object-cover rounded-lg mb-1" />
                <span className="text-[10px] text-[#A89070] uppercase font-mono">{c.label} Angle</span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-[#140E07] border border-[#2A1F13] space-y-1 text-xs text-[#F0E2C8]">
            <div><strong>Name:</strong> {form.name}</div>
            <div><strong>Student ID:</strong> {form.studentId}</div>
            <div><strong>Department:</strong> {form.department} • {form.year}</div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold shadow-md"
          >
            ✓ Complete & Save Biometric Student Profile
          </button>
        </form>
      )}

      {/* Step 6: Success Confirmation */}
      {step === 6 && (
        <div className="text-center py-6 space-y-4 animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-3xl mx-auto">
            ✓
          </div>
          <h3 className="font-serif text-2xl text-[#F0E2C8]">Student Enrolled Successfully!</h3>
          <p className="text-xs text-[#A89070]">
            {form.name} ({form.studentId}) is now active in the recognition database.
          </p>
          <button
            onClick={() => {
              setStep(1);
              setForm({ name: "", studentId: "", department: "Computer Science", year: "Year 3" });
              setCaptures({ front: null, left: null, right: null });
              setDescriptors([]);
            }}
            className="px-6 py-2.5 rounded-xl bg-[#C4622D] text-[#F0E2C8] hover:bg-[#E8943A] text-xs font-semibold shadow-md"
          >
            + Enroll Another Student
          </button>
        </div>
      )}
    </div>
  );
}
