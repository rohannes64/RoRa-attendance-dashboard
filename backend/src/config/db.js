const mongoose = require('mongoose');
const Student = require('../models/Student');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');

// Initial seed data for reproducible zero-setup database
const SEED_STUDENTS = [
  { customId: "1", name: "Aarav Sharma", studentId: "STU-2401", department: "Computer Science", year: "Year 3", avatar: "AS", enrolledDate: "2024-01-15" },
  { customId: "2", name: "Priya Nair", studentId: "STU-2402", department: "Data Science", year: "Year 2", avatar: "PN", enrolledDate: "2024-01-15" },
  { customId: "3", name: "Rohan Verma", studentId: "STU-2403", department: "Electrical Eng.", year: "Year 4", avatar: "RV", enrolledDate: "2024-01-16" },
  { customId: "4", name: "Ananya Iyer", studentId: "STU-2404", department: "Mathematics", year: "Year 1", avatar: "AI", enrolledDate: "2024-01-16" },
  { customId: "5", name: "Vikram Malhotra", studentId: "STU-2405", department: "Computer Science", year: "Year 3", avatar: "VM", enrolledDate: "2024-01-17" },
  { customId: "6", name: "Sneha Reddy", studentId: "STU-2406", department: "Data Science", year: "Year 2", avatar: "SR", enrolledDate: "2024-01-17" },
  { customId: "7", name: "Aditya Deshmukh", studentId: "STU-2407", department: "AI & Robotics", year: "Year 4", avatar: "AD", enrolledDate: "2024-01-18" },
  { customId: "8", name: "Kavya Nair", studentId: "STU-2408", department: "Electrical Eng.", year: "Year 2", avatar: "KN", enrolledDate: "2024-01-18" },
  { customId: "9", name: "Rahul Sen", studentId: "STU-2409", department: "Mathematics", year: "Year 3", avatar: "RS", enrolledDate: "2024-01-19" },
  { customId: "10", name: "Divya Krishnan", studentId: "STU-2410", department: "AI & Robotics", year: "Year 1", avatar: "DK", enrolledDate: "2024-01-19" },
];

const SEED_SESSIONS = [
  {
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

async function seedDatabaseIfEmpty() {
  try {
    const studentCount = await Student.countDocuments();
    if (studentCount === 0) {
      await Student.insertMany(SEED_STUDENTS);
      console.log('🌱 Seeded default students');
    }
    const sessionCount = await Session.countDocuments();
    if (sessionCount === 0) {
      await Session.insertMany(SEED_SESSIONS);
      console.log('🌱 Seeded default sessions');
    }
  } catch (err) {
    console.warn('Database seeding notice:', err.message);
  }
}

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/faceattend';
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB database:', uri);
    await seedDatabaseIfEmpty();
  } catch (err) {
    console.warn('⚠️ MongoDB Connection Notice:', err.message);
    console.warn('Application will proceed with fallback in-memory REST providers.');
  }
}

module.exports = connectDB;
