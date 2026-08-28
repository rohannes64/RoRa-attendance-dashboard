import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export async function fetchStudentsAPI() {
  try {
    const res = await api.get('/students');
    return res.data;
  } catch (err) {
    console.warn('API error fetching students:', err.message);
    return null;
  }
}

export async function createStudentAPI(studentData) {
  try {
    const res = await api.post('/students', studentData);
    return res.data;
  } catch (err) {
    console.warn('API error creating student:', err.message);
    return null;
  }
}

export async function updateStudentAPI(id, studentData) {
  try {
    const res = await api.put(`/students/${id}`, studentData);
    return res.data;
  } catch (err) {
    console.warn('API error updating student:', err.message);
    return null;
  }
}

export async function deleteStudentAPI(id) {
  try {
    const res = await api.delete(`/students/${id}`);
    return res.data;
  } catch (err) {
    console.warn('API error deleting student:', err.message);
    return null;
  }
}

export async function fetchSessionsAPI() {
  try {
    const res = await api.get('/sessions');
    return res.data;
  } catch (err) {
    console.warn('API error fetching sessions:', err.message);
    return null;
  }
}

export async function createSessionAPI(sessionData) {
  try {
    const res = await api.post('/sessions', sessionData);
    return res.data;
  } catch (err) {
    console.warn('API error creating session:', err.message);
    return null;
  }
}

export async function updateSessionAPI(id, sessionData) {
  try {
    const res = await api.put(`/sessions/${id}`, sessionData);
    return res.data;
  } catch (err) {
    console.warn('API error updating session:', err.message);
    return null;
  }
}

export async function startSessionAPI(id) {
  try {
    const res = await api.put(`/sessions/${id}/start`);
    return res.data;
  } catch (err) {
    console.warn('API error starting session:', err.message);
    return null;
  }
}

export async function endSessionAPI(id) {
  try {
    const res = await api.put(`/sessions/${id}/end`);
    return res.data;
  } catch (err) {
    console.warn('API error ending session:', err.message);
    return null;
  }
}

export async function deleteSessionAPI(id) {
  try {
    const res = await api.delete(`/sessions/${id}`);
    return res.data;
  } catch (err) {
    console.warn('API error deleting session:', err.message);
    return null;
  }
}

export async function fetchAttendanceAPI() {
  try {
    const res = await api.get('/attendance');
    return res.data;
  } catch (err) {
    console.warn('API error fetching attendance:', err.message);
    return null;
  }
}

export async function markStudentStatusAPI(sessionId, studentId, status) {
  try {
    const res = await api.post('/attendance/mark', { sessionId, studentId, status });
    return res.data;
  } catch (err) {
    console.warn('API error marking attendance:', err.message);
    return null;
  }
}

export async function deleteAttendanceAPI(id) {
  try {
    const res = await api.delete(`/attendance/${id}`);
    return res.data;
  } catch (err) {
    console.warn('API error deleting attendance:', err.message);
    return null;
  }
}
