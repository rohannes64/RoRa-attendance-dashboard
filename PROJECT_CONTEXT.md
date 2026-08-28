# Attendance AI — Project Context

## Goal
Build a real-time classroom attendance platform using computer vision for face detection, embedding matching, live video tracking, session management, duplicate prevention, analytics, and CSV export.

## Architecture
React (Vite + TailwindCSS + Recharts) → FastAPI (Python) → CV Engine (OpenCV + ArcFace/InsightFace/ONNX) → SQLite (SQLAlchemy)

## Core Principles & Rules
1. **Reliability > Feature Count**: The complete demo flow must work reliably offline/locally.
2. **Duplicate Prevention**: Enforce strict session-level uniqueness so a student is only marked present once per session.
3. **Unknown Face Safety**: Never match unknown faces to enrolled students below threshold (e.g. cosine similarity < 0.50).
4. **Decoupled Architecture**: Modular separation between CV logic, API routes, Database operations, and Frontend components.
5. **Vertical Slices**: Implement task by task according to the 5-phase plan.

## Technical Stack
- **Frontend**: React, Vite, TailwindCSS, Axios, Recharts, Lucide React
- **Backend**: Python 3.14, FastAPI, Uvicorn, SQLAlchemy, SQLite, Pydantic
- **Computer Vision**: OpenCV, NumPy, ONNX Runtime / InsightFace / ArcFace embeddings

## Implementation Phases
- Phase 1: Computer Vision Engine (Detection, Alignment, Embedding, Similarity Matching)
- Phase 2: SQLite Database & Domain Models (Student, Session, Attendance)
- Phase 3: FastAPI Backend API Layer & Endpoints
- Phase 4: React Frontend (Live Camera Overlay, Enrollment, Session Manager, Analytics, Export)
- Phase 5: Tracking Engine & Performance Polish
