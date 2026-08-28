# Attendance AI — Real-Time Face Recognition Attendance System

An automated classroom attendance platform that uses real-time computer vision to detect, recognize, track, and log enrolled students automatically.

## Key Features
- **Multi-Face Real-Time Detection & Recognition**: Bounding boxes, names, and confidence scores live on video.
- **Session Management**: Course-specific attendance sessions with start/stop triggers.
- **Duplicate Attendance Prevention**: Unique database constraints to prevent multiple logs for the same student in a single session.
- **Student Enrollment**: Multi-angle facial embedding generation.
- **Analytics & History**: Session breakdown, attendance percentages, and CSV export.

## Architecture & Stack
- **Frontend**: React, Vite, Vanilla CSS, Lucide Icons, Recharts
- **Backend**: Python 3.14, FastAPI, Uvicorn, SQLAlchemy, SQLite
- **Computer Vision**: OpenCV, NumPy, ONNX Runtime / ArcFace face embeddings

## Getting Started

### Backend Setup
```bash
python -m venv .venv
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
python backend/app/main.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
