const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    subject: { type: String, required: true },
    code: { type: String, required: true },
    instructor: { type: String, default: 'Dr. Faculty' },
    time: { type: String, default: '09:00 – 10:30' },
    room: { type: String, default: 'Room 101' },
    enrolled: { type: Number, default: 0 },
    present: { type: Number, default: 0 },
    color: { type: String, default: '#C4622D' },
    status: { type: String, enum: ['upcoming', 'active', 'completed'], default: 'upcoming' },
    enrolledStudentIds: [{ type: String }],
    startedAt: { type: String },
    endedAt: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);
