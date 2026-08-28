const Session = require('../models/Session');

let memorySessions = [
  {
    id: "cs301",
    sessionId: "cs301",
    subject: "Machine Learning",
    code: "CS 301",
    instructor: "Dr. Amara Osei",
    time: "08:00 – 09:30",
    room: "Lab 4B",
    enrolled: 6,
    present: 4,
    color: "#C4622D",
    status: "active",
    enrolledStudentIds: ["1", "2", "3", "4", "5", "6"],
    startedAt: "08:00 AM",
  },
  {
    id: "ds201",
    sessionId: "ds201",
    subject: "Data Structures",
    code: "DS 201",
    instructor: "Prof. Lena Hartmann",
    time: "10:00 – 11:30",
    room: "Hall A",
    enrolled: 6,
    present: 5,
    color: "#E8943A",
    status: "upcoming",
    enrolledStudentIds: ["2", "4", "6", "8", "9", "10"],
  },
  {
    id: "cv401",
    sessionId: "cv401",
    subject: "Computer Vision",
    code: "CV 401",
    instructor: "Dr. Kenji Mori",
    time: "13:00 – 14:30",
    room: "Lab 2C",
    enrolled: 5,
    present: 4,
    color: "#A0522D",
    status: "upcoming",
    enrolledStudentIds: ["1", "3", "5", "7", "9"],
  },
  {
    id: "db302",
    sessionId: "db302",
    subject: "Database Systems",
    code: "DB 302",
    instructor: "Prof. Malik James",
    time: "09:00 – 10:30",
    room: "Hall B",
    enrolled: 6,
    present: 5,
    color: "#B8601A",
    status: "completed",
    enrolledStudentIds: ["1", "4", "5", "8", "9", "10"],
    startedAt: "09:00 AM",
    endedAt: "10:30 AM",
  },
];

exports.getSessions = async (req, res) => {
  try {
    const docs = await Session.find().sort({ createdAt: -1 });
    if (docs.length > 0) {
      const formatted = docs.map((s) => ({
        id: s.sessionId || s._id.toString(),
        sessionId: s.sessionId || s._id.toString(),
        subject: s.subject,
        code: s.code,
        instructor: s.instructor,
        time: s.time,
        room: s.room,
        enrolled: s.enrolled,
        present: s.present,
        color: s.color,
        status: s.status,
        enrolledStudentIds: s.enrolledStudentIds,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
      }));
      return res.json(formatted);
    }
  } catch (err) {}
  return res.json(memorySessions);
};

exports.createSession = async (req, res) => {
  const { id, sessionId, subject, code, instructor, time, room, enrolled, present, color, status, enrolledStudentIds } = req.body;
  const sId = id || sessionId || `session-${Date.now()}`;

  const newSess = {
    id: sId,
    sessionId: sId,
    subject,
    code,
    instructor: instructor || 'Dr. Faculty',
    time: time || '09:00 – 10:30',
    room: room || 'Room 101',
    enrolled: enrolled || (enrolledStudentIds ? enrolledStudentIds.length : 30),
    present: present || 0,
    color: color || '#C4622D',
    status: status || 'upcoming',
    enrolledStudentIds: enrolledStudentIds || [],
  };

  try {
    const doc = new Session(newSess);
    await doc.save();
  } catch (err) {}

  memorySessions = [newSess, ...memorySessions.filter((s) => s.id !== sId)];
  return res.status(201).json(newSess);
};

exports.updateSession = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    await Session.findOneAndUpdate({ sessionId: id }, updateData);
  } catch (err) {}

  memorySessions = memorySessions.map((s) => (s.id === id ? { ...s, ...updateData } : s));
  return res.json({ success: true });
};

exports.startSession = async (req, res) => {
  const { id } = req.params;
  const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const updateData = { status: 'active', startedAt: nowStr };

  try {
    await Session.findOneAndUpdate({ sessionId: id }, updateData);
  } catch (err) {}

  memorySessions = memorySessions.map((s) => (s.id === id ? { ...s, ...updateData } : s));
  return res.json({ success: true, startedAt: nowStr });
};

exports.endSession = async (req, res) => {
  const { id } = req.params;
  const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const updateData = { status: 'completed', endedAt: nowStr };

  try {
    await Session.findOneAndUpdate({ sessionId: id }, updateData);
  } catch (err) {}

  memorySessions = memorySessions.map((s) => (s.id === id ? { ...s, ...updateData } : s));
  return res.json({ success: true, endedAt: nowStr });
};

exports.deleteSession = async (req, res) => {
  const { id } = req.params;
  try {
    await Session.deleteOne({ sessionId: id });
  } catch (err) {}

  memorySessions = memorySessions.filter((s) => s.id !== id);
  return res.json({ success: true, deletedId: id });
};
