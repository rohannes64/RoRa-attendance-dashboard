import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const StudentService = {
  enrollStudent: (data) => api.post('/students', data),
  getStudents: () => api.get('/students'),
  deleteStudent: (id) => api.delete(`/students/${id}`),
};

export const SessionService = {
  createSession: (data) => api.post('/sessions', data),
  getSessions: () => api.get('/sessions'),
  getActiveSession: () => api.get('/sessions/active/current'),
  getSessionDetails: (id) => api.get(`/sessions/${id}`),
  endSession: (id) => api.post(`/sessions/${id}/end`),
};

export const RecognitionService = {
  processFrame: (imageBase64) => api.post('/recognition/frame', { image_base64: imageBase64 }),
};

export const AttendanceService = {
  getSessionAttendance: (sessionId) => api.get(`/attendance/${sessionId}`),
  exportCSV: (sessionId) => {
    window.open(`${API_BASE_URL}/attendance/${sessionId}/export`, '_blank');
  },
  getAnalyticsSummary: () => api.get('/attendance/analytics/summary'),
};

export default api;
