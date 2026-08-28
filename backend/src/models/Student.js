const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    customId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    studentId: { type: String, required: true, unique: true },
    department: { type: String, default: 'Computer Science' },
    year: { type: String, default: 'Year 3' },
    avatar: { type: String, default: 'ST' },
    enrolledDate: { type: String, default: () => new Date().toISOString().slice(0, 10) },
    photo: { type: String },
    descriptor: [{ type: Number }], // 128D FaceNet embedding vector
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
