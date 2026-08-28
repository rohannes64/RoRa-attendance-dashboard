import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Calendar, Award, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { AttendanceService } from '../services/api';

export default function Analytics() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await AttendanceService.getAnalyticsSummary();
      setSummary(res.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  if (!summary) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
        Loading Analytics & Class Metrics...
      </div>
    );
  }

  const pieData = [
    { name: 'Average Present %', value: summary.average_attendance_rate, color: '#10b981' },
    { name: 'Average Absent %', value: Math.max(0, 100 - summary.average_attendance_rate), color: '#f43f5e' }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Analytics & Intelligence</h2>
          <p className="page-description">Automated classroom attendance trends, session metrics & confidence distribution</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users color="var(--accent-indigo)" size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>ENROLLED STUDENTS</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: '700' }}>{summary.total_students}</h3>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar color="var(--accent-cyan)" size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>TOTAL SESSIONS</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: '700' }}>{summary.total_sessions}</h3>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award color="var(--accent-green)" size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>AVG ATTENDANCE</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--accent-green)' }}>{summary.average_attendance_rate}%</h3>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp color="var(--accent-purple)" size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>ATTENDANCE LOGS</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: '700' }}>{summary.total_attendance_logs}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        {/* Attendance Percentage by Recent Session Chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.25rem' }}>
            Session Attendance Rate (%)
          </h3>

          <div style={{ width: '100%', height: '300px' }}>
            {summary.recent_sessions.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: '5rem', color: 'var(--text-dim)' }}>
                No session data available for chart rendering.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.recent_sessions}>
                  <defs>
                    <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="course" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#121824', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
                  <Area type="monotone" dataKey="percentage" stroke="#6366f1" fillOpacity={1} fill="url(#colorPct)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Present vs Absent Ratio Pie Chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.25rem' }}>
            Overall Class Presence Ratio
          </h3>

          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#121824', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
