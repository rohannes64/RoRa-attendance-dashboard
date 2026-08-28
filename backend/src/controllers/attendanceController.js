const Attendance = require('../models/Attendance');

let memoryAttendance = [];

exports.getAttendance = async (req, res) => {
  try {
    const docs = await Attendance.find().sort({ createdAt: -1 });
    if (docs.length > 0) {
      const formatted = docs.map((r) => ({
        id: r.recordId || r._id.toString(),
        recordId: r.recordId || r._id.toString(),
        sessionId: r.sessionId,
        studentId: r.studentId,
        date: r.date,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        status: r.status,
        markedVia: r.markedVia,
      }));
      return res.json(formatted);
    }
  } catch (err) {}
  return res.json(memoryAttendance);
};

exports.createAttendance = async (req, res) => {
  const { id, recordId, sessionId, studentId, date, checkIn, checkOut, status, markedVia } = req.body;
  const rId = id || recordId || `att-${studentId}-${sessionId || Date.now()}`;

  const newRec = {
    id: rId,
    recordId: rId,
    sessionId: sessionId || null,
    studentId,
    date: date || '2026-08-28',
    checkIn: checkIn || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    checkOut: checkOut || null,
    status: status || 'present',
    markedVia: markedVia || 'ai_face',
  };

  try {
    const doc = new Attendance(newRec);
    await doc.save();
  } catch (err) {}

  memoryAttendance = [newRec, ...memoryAttendance.filter((r) => r.id !== rId)];
  return res.status(201).json(newRec);
};

exports.markStudentStatus = async (req, res) => {
  const { sessionId, studentId, status } = req.body;
  const dateStr = '2026-08-28';
  const timeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const rId = `att-${studentId}-${sessionId || dateStr}`;

  const updatedRec = {
    id: rId,
    recordId: rId,
    sessionId,
    studentId,
    date: dateStr,
    checkIn: status !== 'absent' ? timeStr : null,
    checkOut: null,
    status,
    markedVia: 'manual',
  };

  try {
    await Attendance.findOneAndUpdate(
      { $or: [{ recordId: rId }, { studentId, sessionId }] },
      updatedRec,
      { upsert: true }
    );
  } catch (err) {}

  const existingIdx = memoryAttendance.findIndex(
    (r) => r.studentId === studentId && (sessionId ? r.sessionId === sessionId : r.date === dateStr)
  );

  if (existingIdx >= 0) {
    memoryAttendance[existingIdx] = updatedRec;
  } else {
    memoryAttendance = [updatedRec, ...memoryAttendance];
  }

  return res.json(updatedRec);
};

exports.updateAttendance = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    await Attendance.findOneAndUpdate({ recordId: id }, updateData);
  } catch (err) {}

  memoryAttendance = memoryAttendance.map((r) => (r.id === id ? { ...r, ...updateData } : r));
  return res.json({ success: true });
};

exports.deleteAttendance = async (req, res) => {
  const { id } = req.params;
  try {
    await Attendance.deleteOne({ recordId: id });
  } catch (err) {}

  memoryAttendance = memoryAttendance.filter((r) => r.id !== id);
  return res.json({ success: true, deletedId: id });
};
