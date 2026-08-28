export interface ClassSession {
  id: string;
  courseCode: string;
  courseName: string;
  section: string;
  department: string;
  room: string;
  instructor: string;
  scheduleTime: string;
  enrolledStudentIds: string[];
}

export const PRESET_CLASS_SESSIONS: ClassSession[] = [
  {
    id: 'cs301-sec-a',
    courseCode: 'CS301',
    courseName: 'Deep Learning & Computer Vision',
    section: 'Section A (2024-2028)',
    department: 'Computer Science & AI',
    room: 'Lecture Hall LH-102',
    instructor: 'Prof. K. Ramanujan, Ph.D.',
    scheduleTime: '09:00 AM - 10:30 AM',
    enrolledStudentIds: [
      'std-in-001',
      'std-in-002',
      'std-in-003',
      'std-in-004',
      'std-in-005',
      'std-in-006',
      'std-in-007',
      'std-in-008',
      'std-in-009',
      'std-in-010',
      'std-in-011',
      'std-in-012',
    ],
  },
  {
    id: 'ai402-sec-b',
    courseCode: 'AI402',
    courseName: 'Natural Language Processing & LLMs',
    section: 'Section B (2024-2028)',
    department: 'AI & Data Science',
    room: 'Computing Lab AI-204',
    instructor: 'Dr. Priya Sundaram',
    scheduleTime: '11:00 AM - 12:30 PM',
    enrolledStudentIds: [
      'std-in-001',
      'std-in-002',
      'std-in-004',
      'std-in-007',
      'std-in-008',
      'std-in-010',
      'std-in-012',
    ],
  },
  {
    id: 'ec204-sec-a',
    courseCode: 'EC204',
    courseName: 'Digital Signal Processing & VLSI',
    section: 'Section A (2024-2028)',
    department: 'Electronics & VLSI',
    room: 'Hardware Lab EE-105',
    instructor: 'Prof. Vikram Sengupta',
    scheduleTime: '02:00 PM - 03:30 PM',
    enrolledStudentIds: [
      'std-in-003',
      'std-in-005',
      'std-in-006',
      'std-in-009',
      'std-in-011',
    ],
  },
  {
    id: 'it305-sec-c',
    courseCode: 'IT305',
    courseName: 'Cloud & Distributed Systems',
    section: 'Section C (2024-2028)',
    department: 'Information Technology',
    room: 'Lecture Hall LH-201',
    instructor: 'Dr. Rajeshwari Nair',
    scheduleTime: '03:45 PM - 05:15 PM',
    enrolledStudentIds: [
      'std-in-001',
      'std-in-003',
      'std-in-007',
      'std-in-009',
      'std-in-010',
      'std-in-011',
      'std-in-012',
    ],
  },
];
