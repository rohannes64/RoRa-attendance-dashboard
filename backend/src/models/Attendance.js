const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    recordId: { type: String, required: true, unique: true },
    sessionId: { type: String },
    studentId: { type: String, required: true },
    date: { type: String, required: true },
    checkIn: { type: String, default: null },
    checkOut: { type: String, default: null },
    status: { type: String, enum: ['present', 'late', 'absent'], default: 'present' },
    markedVia: { type: String, enum: ['ai_face', 'manual'], default: 'ai_face' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
