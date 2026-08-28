const Student = require('../models/Student');

// In-memory fallback if MongoDB connection is inactive
let memoryStudents = [
  { customId: "1", id: "1", name: "Aarav Sharma", studentId: "STU-2401", department: "Computer Science", year: "Year 3", avatar: "AS", enrolledDate: "2024-01-15" },
  { customId: "2", id: "2", name: "Priya Nair", studentId: "STU-2402", department: "Data Science", year: "Year 2", avatar: "PN", enrolledDate: "2024-01-15" },
  { customId: "3", id: "3", name: "Rohan Verma", studentId: "STU-2403", department: "Electrical Eng.", year: "Year 4", avatar: "RV", enrolledDate: "2024-01-16" },
  { customId: "4", id: "4", name: "Ananya Iyer", studentId: "STU-2404", department: "Mathematics", year: "Year 1", avatar: "AI", enrolledDate: "2024-01-16" },
  { customId: "5", id: "5", name: "Vikram Malhotra", studentId: "STU-2405", department: "Computer Science", year: "Year 3", avatar: "VM", enrolledDate: "2024-01-17" },
  { customId: "6", id: "6", name: "Sneha Reddy", studentId: "STU-2406", department: "Data Science", year: "Year 2", avatar: "SR", enrolledDate: "2024-01-17" },
];

exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    if (students.length > 0) {
      const formatted = students.map((s) => ({
        id: s.customId || s._id.toString(),
        name: s.name,
        studentId: s.studentId,
        department: s.department,
        year: s.year,
        avatar: s.avatar,
        enrolledDate: s.enrolledDate,
        photo: s.photo,
        descriptor: s.descriptor,
      }));
      return res.json(formatted);
    }
  } catch (err) {}
  return res.json(memoryStudents);
};

exports.createStudent = async (req, res) => {
  const { id, customId, name, studentId, department, year, avatar, photo, descriptor } = req.body;
  const cId = id || customId || `custom-${Date.now()}`;
  const sId = studentId || `STU-${Date.now()}`;
  const av = avatar || (name ? name.slice(0, 2).toUpperCase() : 'ST');

  const newSt = {
    customId: cId,
    id: cId,
    name,
    studentId: sId,
    department: department || 'Computer Science',
    year: year || 'Year 3',
    avatar: av,
    enrolledDate: new Date().toISOString().slice(0, 10),
    photo,
    descriptor,
  };

  try {
    const doc = new Student(newSt);
    await doc.save();
  } catch (err) {}

  memoryStudents = [newSt, ...memoryStudents.filter((s) => s.id !== cId && s.studentId !== sId)];
  return res.status(201).json(newSt);
};

exports.updateStudent = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    await Student.findOneAndUpdate({ customId: id }, updateData);
  } catch (err) {}

  memoryStudents = memoryStudents.map((s) => (s.id === id || s.studentId === id ? { ...s, ...updateData } : s));
  return res.json({ success: true });
};

exports.deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    await Student.deleteOne({ $or: [{ customId: id }, { studentId: id }] });
  } catch (err) {}

  memoryStudents = memoryStudents.filter((s) => s.id !== id && s.studentId !== id);
  return res.json({ success: true, deletedId: id });
};
