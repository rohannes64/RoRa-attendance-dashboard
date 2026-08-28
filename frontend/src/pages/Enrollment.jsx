import React, { useState, useRef, useEffect } from 'react';
import { Camera, Check, Plus, Trash2, UserPlus, RefreshCw, FlipHorizontal } from 'lucide-react';
import { StudentService } from '../services/api';

export default function Enrollment() {
  const videoRef = useRef(null);
  
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [capturedFrames, setCapturedFrames] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Camera Flipping States
  const [isMirrored, setIsMirrored] = useState(true);
  const [facingMode, setFacingMode] = useState('user');

  const captureSteps = ['Front View', 'Slightly Left', 'Slightly Right'];

  useEffect(() => {
    fetchStudents();
    startCamera(facingMode);

    return () => stopCamera();
  }, [facingMode]);

  const startCamera = async (mode) => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: mode } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  const toggleMirrorMode = () => {
    setIsMirrored((prev) => !prev);
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const fetchStudents = async () => {
    try {
      const res = await StudentService.getStudents();
      setEnrolledStudents(res.data);
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const b64 = canvas.toDataURL('image/jpeg', 0.9);

    setCapturedFrames((prev) => [...prev, b64]);
  };

  const handleResetCaptures = () => {
    setCapturedFrames([]);
  };

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !studentId.trim()) {
      setMessage({ type: 'danger', text: 'Please fill in Name and Student ID.' });
      return;
    }
    if (capturedFrames.length < 3) {
      setMessage({ type: 'danger', text: 'Please capture all 3 multi-angle face photos.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await StudentService.enrollStudent({
        name,
        student_id: studentId,
        images_base64: capturedFrames
      });

      setMessage({ type: 'success', text: `Successfully enrolled ${name} (${studentId})!` });
      setName('');
      setStudentId('');
      setCapturedFrames([]);
      fetchStudents();
    } catch (err) {
      const errorText = err.response?.data?.detail || 'Enrollment failed.';
      setMessage({ type: 'danger', text: errorText });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (id, studentName) => {
    if (window.confirm(`Are you sure you want to delete ${studentName}?`)) {
      try {
        await StudentService.deleteStudent(id);
        fetchStudents();
      } catch (err) {
        alert('Failed to delete student.');
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Student Enrollment</h2>
          <p className="page-description">Register new students with composite multi-angle facial embeddings</p>
        </div>
      </div>

      {message && (
        <div className={`badge ${message.type === 'success' ? 'badge-success' : 'badge-danger'}`} style={{ padding: '0.85rem 1.25rem', width: '100%', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={20} color="var(--accent-indigo)" />
            Add New Student
          </h3>

          <form onSubmit={handleEnrollSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rohan Vemuri"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Student Roll/ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 23BCS001"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">
                  Face Capture Wizard ({capturedFrames.length} / 3 Captures)
                </label>
                
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                    onClick={toggleMirrorMode}
                  >
                    <FlipHorizontal size={14} />
                    {isMirrored ? 'Mirrored' : 'Normal'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                    onClick={toggleFacingMode}
                  >
                    <RefreshCw size={14} />
                    {facingMode === 'user' ? 'Front' : 'Back'}
                  </button>
                </div>
              </div>
              
              <div className="camera-container" style={{ aspectRatio: '16/9', maxHeight: '280px', marginTop: '0.5rem' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="camera-video"
                  style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                {capturedFrames.length < 3 ? (
                  <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={handleCaptureFrame}>
                    <Camera size={18} />
                    Capture: {captureSteps[capturedFrames.length]}
                  </button>
                ) : (
                  <button type="button" className="btn btn-secondary" style={{ flex: 1, borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }} disabled>
                    <Check size={18} /> Captures Complete
                  </button>
                )}

                {capturedFrames.length > 0 && (
                  <button type="button" className="btn btn-secondary" onClick={handleResetCaptures}>
                    <RefreshCw size={16} /> Reset
                  </button>
                )}
              </div>
            </div>

            {capturedFrames.length > 0 && (
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {capturedFrames.map((img, idx) => (
                  <div key={idx} style={{ textAlign: 'center' }}>
                    <img src={img} alt={`Capture ${idx}`} style={{ width: '80px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '2px solid var(--accent-indigo)' }} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>{captureSteps[idx]}</span>
                  </div>
                ))}
              </div>
            )}

            <button type="submit" className="btn btn-success" style={{ width: '100%', padding: '0.85rem' }} disabled={loading || capturedFrames.length < 3}>
              {loading ? 'Saving Embedding Vector...' : 'Save & Register Student'}
            </button>
          </form>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1.25rem' }}>
            Enrolled Students ({enrolledStudents.length})
          </h3>

          {enrolledStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)' }}>
              No students enrolled yet. Use the form to capture faces and enroll.
            </div>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: '500px' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student Info</th>
                    <th>Date Enrolled</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledStudents.map((st) => (
                    <tr key={st.id}>
                      <td>
                        <div style={{ fontWeight: '600', color: '#fff' }}>{st.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>{st.student_id}</div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{st.created_at}</td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.6rem', color: 'var(--accent-rose)' }}
                          onClick={() => handleDeleteStudent(st.id, st.name)}
                        >
                          <Trash2 size={16} />
                        </button>
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
