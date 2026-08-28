import React, { useState, useEffect } from 'react';
import { Calendar, Play, Download, CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react';
import { SessionService, AttendanceService } from '../services/api';

export default function Sessions({ onNavigateToLive }) {
  const [sessions, setSessions] = useState([]);
  const [course, setCourse] = useState('Data Structures');
  const [section, setSection] = useState('CSE-A');
  const [selectedSessionDetails, setSelectedSessionDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await SessionService.getSessions();
      setSessions(res.data);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!course.trim() || !section.trim()) return;

    setLoading(true);
    try {
      await SessionService.createSession({ course, section });
      await fetchSessions();
      onNavigateToLive();
    } catch (err) {
      alert('Failed to start session.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = async (id) => {
    try {
      const res = await SessionService.getSessionDetails(id);
      setSelectedSessionDetails(res.data);
    } catch (err) {
      console.error('Error getting session details:', err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Classroom Sessions</h2>
          <p className="page-description">Create attendance sessions, inspect attendance logs & export CSV reports</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem' }}>
        {/* Left: Start New Session Form */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Play size={20} color="var(--accent-green)" />
            Start New Session
          </h3>

          <form onSubmit={handleCreateSession}>
            <div className="form-group">
              <label className="form-label">Course Title</label>
              <input
                type="text"
                className="form-input"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g. Data Structures & Algorithms"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Section / Batch</label>
              <input
                type="text"
                className="form-input"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. CSE-A"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Initializing Session...' : 'Start Session & Launch Camera'}
            </button>
          </form>
        </div>

        {/* Right: Sessions History List & Detail Drawer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1.25rem' }}>
              Attendance History ({sessions.length} Sessions)
            </h3>

            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                No past sessions recorded. Start a session to view history.
              </div>
            ) : (
              <div style={{ overflowY: 'auto', maxHeight: '280px' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Course & Section</th>
                      <th>Date / Time</th>
                      <th>Status</th>
                      <th>Attendance</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div style={{ fontWeight: '600', color: '#fff' }}>{s.course}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Section {s.section}</div>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.started_at}</td>
                        <td>
                          <span className={`badge ${s.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: '600', color: 'var(--accent-cyan)' }}>
                            {s.present_count} / {s.total_enrolled} ({s.attendance_percentage}%)
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                              onClick={() => handleSelectSession(s.id)}
                            >
                              Details
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.6rem' }}
                              onClick={() => AttendanceService.exportCSV(s.id)}
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Session Detail Inspector */}
          {selectedSessionDetails && (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                    {selectedSessionDetails.session.course} ({selectedSessionDetails.session.section})
                  </h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                    Session ID: {selectedSessionDetails.session.id} • Started: {selectedSessionDetails.session.started_at}
                  </span>
                </div>
                <button
                  className="btn btn-success"
                  onClick={() => AttendanceService.exportCSV(selectedSessionDetails.session.id)}
                >
                  <Download size={16} /> Export Session CSV
                </button>
              </div>

              <div style={{ overflowY: 'auto', maxHeight: '320px' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Student Roll</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Marked Time</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSessionDetails.students.map((st, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>{st.student_id}</td>
                        <td style={{ fontWeight: '600' }}>{st.name}</td>
                        <td>
                          {st.status === 'PRESENT' ? (
                            <span className="badge badge-success"><CheckCircle size={12} /> PRESENT</span>
                          ) : (
                            <span className="badge badge-danger"><XCircle size={12} /> ABSENT</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{st.timestamp || '—'}</td>
                        <td>{st.confidence ? `${st.confidence}%` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
