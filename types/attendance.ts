export interface StudentProfile {
  id: string;
  rollNo: string;
  name: string;
  branch: string;
  semester: number;
  section: string;
  email: string;
  avatarUrl: string;
  gender: 'Male' | 'Female' | 'Other';
  descriptor: number[]; // 128D FaceNet embedding
  enrolledAt: string;
  totalSessions: number;
  attendedSessions: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  rollNo: string;
  studentName: string;
  branch: string;
  avatarUrl: string;
  sessionId: string;
  courseCode: string;
  courseName: string;
  timestamp: string;
  confidence: number;
  distance: number;
  livenessScore: number;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'MANUAL_OVERRIDE' | 'FLAGGED';
  matchMethod: 'FACENET_128D' | 'MANUAL' | 'BENCHMARK';
  snapshotUrl?: string;
  notes?: string;
}

export interface AttendanceSession {
  id: string;
  courseCode: string;
  courseName: string;
  instructor: string;
  room: string;
  startTime: string;
  endTime: string;
  date: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  totalStudents: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
}

export interface DetectionResult {
  id: string;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: { x: number; y: number }[];
  matchedStudent?: StudentProfile | null;
  distance: number;
  confidence: number;
  livenessScore: number;
  isLive: boolean;
  blinkDetected: boolean;
  age?: number;
  gender?: string;
  expression?: string;
}

export interface BenchmarkTestCase {
  id: string;
  name: string;
  category: 'STANDARD' | 'LIGHTING_VARIATION' | 'OCCLUSION' | 'ANGLE_TILT' | 'MULTI_FACE';
  imageUrl: string;
  groundTruthRollNo: string;
  groundTruthName: string;
  description: string;
  expectedConfidenceRange: [number, number];
}

export interface SystemStats {
  totalEnrolled: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  attendanceRate: number;
  avgLatencyMs: number;
  livenessPassRate: number;
  engineMode: 'SSD_MOBILENET' | 'TINY_FACE';
}
