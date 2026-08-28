export interface Student {
  id: string;
  name: string;
  studentId: string;
  department: string;
  year: string;
  avatar: string;
  enrolledDate: string;
  photo?: string;
  descriptor?: number[]; // 128D FaceNet embedding
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "present" | "late" | "absent";
}

// Generate seeded unit-normalized 128D vectors for reproducible matching
function generateSeededDescriptor(seed: number): number[] {
  const vec: number[] = [];
  let s = seed;
  for (let i = 0; i < 128; i++) {
    s = (s * 9301 + 49297) % 233280;
    const val = (s / 233280.0) * 2 - 1;
    vec.push(val);
  }
  const norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0));
  return vec.map((v) => Number((v / (norm || 1)).toFixed(6)));
}

export const STUDENTS: Student[] = [
  {
    id: "1",
    name: "Aarav Sharma",
    studentId: "STU-2401",
    department: "Computer Science",
    year: "Year 3",
    avatar: "AS",
    enrolledDate: "2024-01-15",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
    descriptor: generateSeededDescriptor(101),
  },
  {
    id: "2",
    name: "Priya Nair",
    studentId: "STU-2402",
    department: "Data Science",
    year: "Year 2",
    avatar: "PN",
    enrolledDate: "2024-01-15",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200",
    descriptor: generateSeededDescriptor(102),
  },
  {
    id: "3",
    name: "Rohan Verma",
    studentId: "STU-2403",
    department: "Electrical Eng.",
    year: "Year 4",
    avatar: "RV",
    enrolledDate: "2024-01-16",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    descriptor: generateSeededDescriptor(103),
  },
  {
    id: "4",
    name: "Ananya Iyer",
    studentId: "STU-2404",
    department: "Mathematics",
    year: "Year 1",
    avatar: "AI",
    enrolledDate: "2024-01-16",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200",
    descriptor: generateSeededDescriptor(104),
  },
  {
    id: "5",
    name: "Vikram Malhotra",
    studentId: "STU-2405",
    department: "Computer Science",
    year: "Year 3",
    avatar: "VM",
    enrolledDate: "2024-01-17",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    descriptor: generateSeededDescriptor(201),
  },
  {
    id: "6",
    name: "Sneha Reddy",
    studentId: "STU-2406",
    department: "Data Science",
    year: "Year 2",
    avatar: "SR",
    enrolledDate: "2024-01-17",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
    descriptor: generateSeededDescriptor(202),
  },
  {
    id: "7",
    name: "Aditya Deshmukh",
    studentId: "STU-2407",
    department: "AI & Robotics",
    year: "Year 4",
    avatar: "AD",
    enrolledDate: "2024-01-18",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200",
    descriptor: generateSeededDescriptor(301),
  },
  {
    id: "8",
    name: "Kavya Nair",
    studentId: "STU-2408",
    department: "Electrical Eng.",
    year: "Year 2",
    avatar: "KN",
    enrolledDate: "2024-01-18",
    photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200",
    descriptor: generateSeededDescriptor(302),
  },
  {
    id: "9",
    name: "Rahul Sen",
    studentId: "STU-2409",
    department: "Mathematics",
    year: "Year 3",
    avatar: "RS",
    enrolledDate: "2024-01-19",
    photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200",
    descriptor: generateSeededDescriptor(401),
  },
  {
    id: "10",
    name: "Divya Krishnan",
    studentId: "STU-2410",
    department: "AI & Robotics",
    year: "Year 1",
    avatar: "DK",
    enrolledDate: "2024-01-19",
    photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200",
    descriptor: generateSeededDescriptor(402),
  },
  {
    id: "11",
    name: "Ishan Joshi",
    studentId: "STU-2411",
    department: "Computer Science",
    year: "Year 2",
    avatar: "IJ",
    enrolledDate: "2024-01-20",
    photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200",
    descriptor: generateSeededDescriptor(501),
  },
  {
    id: "12",
    name: "Pooja Mehra",
    studentId: "STU-2412",
    department: "Data Science",
    year: "Year 4",
    avatar: "PM",
    enrolledDate: "2024-01-20",
    photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200",
    descriptor: generateSeededDescriptor(601),
  },
];

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getDeterministicTime(studentId: string, dateStr: string, isLate: boolean, isCheckOut: boolean): string {
  let seed = 0;
  for (let i = 0; i < studentId.length; i++) seed += studentId.charCodeAt(i);
  for (let i = 0; i < dateStr.length; i++) seed += dateStr.charCodeAt(i) * (i + 1);

  if (isCheckOut) {
    const minOffset = Math.floor(pseudoRandom(seed + 99) * 45); // 0 to 45 mins
    const h = 16 + Math.floor(pseudoRandom(seed + 55) * 2); // 16 or 17
    return `${String(h).padStart(2, "0")}:${String(minOffset).padStart(2, "0")}`;
  }

  if (isLate) {
    const m = 20 + Math.floor(pseudoRandom(seed + 33) * 35); // 08:20 - 08:55
    return `08:${String(m).padStart(2, "0")}`;
  } else {
    const m = 40 + Math.floor(pseudoRandom(seed + 11) * 19); // 07:40 - 07:59 or 08:00 - 08:15
    if (m >= 60) {
      return `08:${String(m - 60).padStart(2, "0")}`;
    }
    return `07:${String(m).padStart(2, "0")}`;
  }
}

function genRecords(dateStr: string, absentIds: string[], lateIds: string[]): AttendanceRecord[] {
  return STUDENTS.map((s) => {
    if (absentIds.includes(s.id)) {
      return { id: `${s.id}-${dateStr}`, studentId: s.id, date: dateStr, checkIn: null, checkOut: null, status: "absent" };
    }
    const isLate = lateIds.includes(s.id);
    const checkIn = getDeterministicTime(s.id, dateStr, isLate, false);
    const checkOut = getDeterministicTime(s.id, dateStr, isLate, true);
    return { id: `${s.id}-${dateStr}`, studentId: s.id, date: dateStr, checkIn, checkOut, status: isLate ? "late" : "present" };
  });
}

export const ATTENDANCE: AttendanceRecord[] = [
  ...genRecords("2026-08-28", ["4", "9"], ["1", "3"]),
  ...genRecords("2026-08-27", ["7", "11"], ["2", "8"]),
  ...genRecords("2026-08-26", ["2", "5", "12"], ["4", "6"]),
  ...genRecords("2026-08-25", ["1", "8"], ["3", "10"]),
  ...genRecords("2026-08-22", ["3", "6", "10"], ["5", "7"]),
];

export const DEPARTMENTS = ["Computer Science", "Data Science", "Electrical Eng.", "Mathematics", "AI & Robotics"];
export const YEARS = ["Year 1", "Year 2", "Year 3", "Year 4"];
