import React, { useRef, useEffect, useState } from 'react';
import { Camera, CheckCircle2, AlertTriangle, Play, Square, Download, UserCheck, ShieldAlert } from 'lucide-react';
import { SessionService, RecognitionService, AttendanceService } from '../services/api';

export default function LiveAttendance({ onNavigateToSessions }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [activeSession, setActiveSession] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [recentlyRecognized, setRecentlyRecognized] = useState([]);
  const [unknownDetected, setUnknownDetected] = useState(false);
  const [notification, setNotification] = useState(null);

  // Fetch current active session
  const fetchActiveSession = async () => {
    try {
      const res = await SessionService.getActiveSession();
      if (res.data.active) {
        setActiveSession(res.data.session);
        fetchSessionAttendance(res.data.session.id);
      } else {
        setActiveSession(null);
      }
    } catch (err) {
      console.error('Error fetching active session:', err);
    }
  };

  const fetchSessionAttendance = async (sessionId) => {
    try {
      const res = await AttendanceService.getSessionAttendance(sessionId);
      setRecentlyRecognized(res.data);
    } catch (err) {
      console.error('Error fetching session attendance:', err);
    }
  };

  useEffect(() => {
    fetchActiveSession();
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error('Webcam access error:', err);
      showToast('Unable to access webcam. Please allow camera permissions.', 'danger');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((track) => track.stop());
      setIsCameraActive(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Continuous frame analysis loop
  useEffect(() => {
    let intervalId;
    if (isCameraActive) {
      intervalId = setInterval(async () => {
        captureAndAnalyzeFrame();
      }, 500); // 2 FPS recognition update loop
    }
    return () => clearInterval(intervalId);
  }, [isCameraActive, activeSession]);

  const captureAndAnalyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to offscreen canvas to extract base64 data
    const offscreen = document.createElement('canvas');
    offscreen.width = video.videoWidth;
    offscreen.height = video.videoHeight;
    const offCtx = offscreen.getContext('2d');
    offCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    const base64Image = offscreen.toDataURL('image/jpeg', 0.85);

    try {
      const res = await RecognitionService.processFrame(base64Image);
      const faces = res.data.faces || [];
      
      // Clear overlay canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let hasUnknown = false;

      faces.forEach((face) => {
        const [x, y, w, h] = face.box;
        const isKnown = face.is_known;
        
        if (!isKnown) {
          hasUnknown = true;
        }

        // Box styling
        ctx.lineWidth = 3;
        ctx.strokeStyle = isKnown ? '#10b981' : '#f43f5e';
        ctx.shadowColor = isKnown ? '#10b981' : '#f43f5e';
        ctx.shadowBlur = 10;
        ctx.strokeRect(x, y, w, h);

        // Name & Confidence Badge overlay
        const label = isKnown
          ? `${face.name} (${face.confidence}%)`
          : `UNKNOWN (${face.confidence}%)`;

        ctx.font = 'bold 14px Outfit, sans-serif';
        const textWidth = ctx.measureText(label).width;

        ctx.fillStyle = isKnown ? 'rgba(16, 185, 129, 0.9)' : 'rgba(244, 63, 94, 0.9)';
        ctx.shadowBlur = 0;
        ctx.fillRect(x, Math.max(0, y - 28), textWidth + 16, 26);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, x + 8, Math.max(18, y - 9));
      });

      setUnknownDetected(hasUnknown);

      // Handle new attendance events
      if (res.data.new_attendance_events && res.data.new_attendance_events.length > 0) {
        res.data.new_attendance_events.forEach((ev) => {
          showToast(`✓ Marked Present: ${ev.name} (${ev.confidence}%)`, 'success');
        });
        if (activeSession) {
          fetchSessionAttendance(activeSession.id);
          fetchActiveSession();
        }
      }
    } catch (err) {
      console.error('Frame processing error:', err);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    try {
      await SessionService.endSession(activeSession.id);
      showToast('Session ended successfully.', 'success');
      fetchActiveSession();
    } catch (err) {
      showToast('Failed to end session.', 'danger');
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Live Attendance Console</h2>
          <p className="page-description">
            Real-time computer vision detection, identity matching & auto-logging
          </p>
        </div>

        {activeSession ? (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button className="btn btn-danger" onClick={handleEndSession}>
              <Square size={18} />
              End Session
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => AttendanceService.exportCSV(activeSession.id)}
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={onNavigateToSessions}>
            <Play size={18} />
            Start Session
          </button>
        )}
      </div>

      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`badge ${
            notification.type === 'success' ? 'badge-success' : 'badge-danger'
          }`}
          style={{
            display: 'block',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            fontSize: '0.95rem',
            borderRadius: '12px',
          }}
        >
          {notification.msg}
        </div>
      )}

      {/* Active Session Summary Banner */}
      {activeSession ? (
        <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.1))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="badge badge-success" style={{ marginBottom: '0.5rem' }}>SESSION ACTIVE</span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '700' }}>{activeSession.course}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Section: {activeSession.section} • Started: {activeSession.started_at}</p>
            </div>
            <div style={{ display: 'flex', gap: '2rem', textAlign: 'right' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>PRESENT</span>
                <p style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--accent-green)' }}>
                  {activeSession.present_count} / {activeSession.total_enrolled}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>ATTENDANCE RATE</span>
                <p style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--accent-cyan)' }}>
                  {activeSession.attendance_percentage}%
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ marginBottom: '1.5rem', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <AlertTriangle color="var(--accent-amber)" size={24} />
            <div>
              <p style={{ fontWeight: '600', color: 'var(--accent-amber)' }}>No Session Active</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Camera displays live recognition overlays. Click "Start Session" to enable automatic attendance database logging.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid: Camera Viewport + Live Attendance List */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
        {/* Left: Camera Feed */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
            <h4 style={{ fontWeight: '600' }}>Webcam Live Feed</h4>
            {unknownDetected && (
              <span className="badge badge-danger">
                <ShieldAlert size={14} /> UNKNOWN PERSON DETECTED
              </span>
            )}
          </div>

          <div className="camera-container">
            <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
            <canvas ref={canvasRef} className="camera-canvas" />
          </div>
        </div>

        {/* Right: Live Attendance Log Table */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={18} color="var(--accent-green)" />
            Logged Attendance ({recentlyRecognized.length})
          </h4>

          {recentlyRecognized.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
              No students recorded present yet. Position enrolled faces in camera frame.
            </div>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: '420px' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Time</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {recentlyRecognized.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{item.student_id}</div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.timestamp}</td>
                      <td>
                        <span className="badge badge-success">{item.confidence}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
