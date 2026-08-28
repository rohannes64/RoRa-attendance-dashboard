# Real-Time Attendance via Face Recognition
## Hackathon Implementation Plan

> **Goal:** Build a polished, reliable attendance platform that uses real-time computer vision to detect, recognize, track, and log enrolled students automatically.
>
> **Core judging story:**  
> "A real-time, privacy-conscious attendance system that detects, recognizes, and tracks students, automatically records attendance, provides session analytics, and exports attendance records."

---

# 1. Product Vision

Do **not** build a basic:

```text
webcam -> face_recognition -> present/absent
```

Build a small attendance platform that happens to use computer vision.

The finished experience should be:

```text
Camera opens
    ↓
Multiple faces detected
    ↓
Faces recognized using embeddings
    ↓
Bounding boxes + names + confidence displayed
    ↓
Attendance automatically recorded
    ↓
Duplicate attendance prevented
    ↓
Unknown people rejected
    ↓
Session ends
    ↓
Analytics generated
    ↓
Attendance exported as CSV
```

The most important objective is **reliability of the complete demo flow**, not maximum feature count.

---

# 2. Architecture

```text
                 ┌─────────────────────────┐
                 │      React Frontend      │
                 │                         │
                 │  Live Camera            │
                 │  Face Overlays           │
                 │  Attendance Table        │
                 │  Session Controls        │
                 │  Analytics               │
                 └────────────┬────────────┘
                              │
                         REST / WebSocket
                              │
                 ┌────────────▼────────────┐
                 │      FastAPI Backend    │
                 │                         │
                 │ /students               │
                 │ /sessions               │
                 │ /recognition             │
                 │ /attendance              │
                 │ /export                  │
                 └────────────┬────────────┘
                              │
                 ┌────────────▼────────────┐
                 │     CV Processing       │
                 │                         │
                 │ Face Detection           │
                 │ Face Embeddings          │
                 │ Similarity Matching      │
                 │ Tracking                 │
                 │ Duplicate Prevention     │
                 └────────────┬────────────┘
                              │
                 ┌────────────▼────────────┐
                 │        SQLite DB        │
                 │                         │
                 │ Students                │
                 │ Face Embeddings         │
                 │ Sessions                │
                 │ Attendance              │
                 └─────────────────────────┘
```

### Data flow

```text
Camera frame
    ↓
Face detection
    ↓
Face alignment
    ↓
Face embedding
    ↓
Cosine similarity
    ↓
Identity decision
    ↓
Tracking / temporal consistency
    ↓
Session validation
    ↓
Duplicate prevention
    ↓
Attendance event
    ↓
SQLite
    ↓
Frontend update
```

---

# 3. Technology Stack

## Frontend

- React
- Vite
- TailwindCSS
- Axios
- Recharts
- Lucide icons

## Backend

- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- SQLite
- NumPy
- OpenCV
- ONNX Runtime

## Computer Vision

Recommended:

- InsightFace
- ArcFace embeddings
- OpenCV for camera/frame processing
- Lightweight face tracking

### Important principle

Do **not** train a face-recognition model from scratch during the hackathon.

Use an existing strong face embedding model and build the application around it.

---

# 4. Core MVP Features

The following should be fully working before spending significant time on bonus features.

## 4.1 Student Enrollment

Create an enrollment screen:

```text
┌───────────────────────────────────────────┐
│              ADD STUDENT                  │
│                                           │
│  Name                                     │
│  [ Rohan Vemuri                    ]      │
│                                           │
│  Student ID                               │
│  [ 23BCS001                       ]       │
│                                           │
│           ┌───────────────┐               │
│           │    CAMERA     │               │
│           │               │               │
│           │      🙂       │               │
│           └───────────────┘               │
│                                           │
│       [ Capture Face ]                    │
└───────────────────────────────────────────┘
```

### Enrollment process

Capture several frames rather than relying on a single image:

```text
Front
  ↓
Slightly left
  ↓
Slightly right
```

Generate an embedding for each capture.

Combine them:

```python
final_embedding = np.mean(embeddings, axis=0)
```

Normalize the resulting embedding before storage.

Store:

- Student name
- Student ID
- Embedding
- Creation timestamp

---

# 5. Face Recognition

The system should use embeddings rather than raw image comparison.

Example:

```text
Rohan
  ↓
Face embedding
  ↓
[0.031, -0.182, 0.442, ...]
  ↓
512-dimensional vector
```

For a camera face:

```text
Camera face
    ↓
Embedding
    ↓
Cosine similarity against enrolled embeddings
    ↓
Rohan: 0.91
Aman:  0.43
Karan: 0.28
    ↓
Rohan
```

### Recognition decision

Use configurable thresholds.

Example starting point:

```text
similarity > 0.70
        ↓
   recognized

0.50–0.70
        ↓
   uncertain

< 0.50
        ↓
    unknown
```

These are **starting values**, not universal truths. Tune the threshold against the actual enrollment/camera conditions.

Never assign an unknown person to a student just because they are the closest match.

---

# 6. Live Attendance

This is the main demo screen and the most important part of the product.

The webcam should display live video with overlays.

Example:

```text
┌─────────────────────────────────────────┐
│                                         │
│       ┌────────────────┐                │
│       │ Rohan Vemuri   │                │
│       │ ✓ 98.2%        │                │
│       └────────────────┘                │
│                                         │
│                     ┌──────────────┐    │
│                     │ Aman Sharma  │    │
│                     │ ✓ 94.7%      │    │
│                     └──────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

Alongside the camera:

```text
LIVE ATTENDANCE

Present
────────
✓ Rohan Vemuri       10:42:31
✓ Aman Sharma        10:42:33
✓ Karan Singh        10:42:38

Unknown Faces
─────────────
? Unknown            10:42:40
```

### Required behavior

When a known student is recognized:

1. Draw bounding box.
2. Display name.
3. Display confidence.
4. Record attendance if not already recorded.
5. Update the attendance UI immediately.

---

# 7. Duplicate Attendance Prevention

A student may be recognized hundreds or thousands of times while standing in front of the camera.

Do not create hundreds of attendance records.

Logic:

```python
if student_id not in current_session_attendance:
    mark_present(student_id)
```

Database should additionally enforce uniqueness:

```text
UNIQUE(session_id, student_id)
```

Expected behavior:

```text
Rohan recognized
    ↓
Attendance recorded

Rohan recognized again
    ↓
Already recorded
    ↓
No duplicate
```

This is a critical reliability feature.

---

# 8. Face Tracking

Add tracking after basic recognition works.

Do not perform expensive recognition on every frame if it can be avoided.

Naive approach:

```text
Frame 1 -> detect + recognize
Frame 2 -> detect + recognize
Frame 3 -> detect + recognize
Frame 4 -> detect + recognize
...
```

Better:

```text
Frame 1
  ↓
Detection + recognition
  ↓
Tracking

Frame 2
  ↓
Tracking

Frame 3
  ↓
Tracking

...
  ↓
Every N frames
  ↓
Recognition refresh
```

A lightweight tracker or ByteTrack-style approach can be used.

For a hackathon, even a simple IoU-based tracker can be enough if it is reliable.

Concept:

```text
Face #17
   ↓
Rohan
   ↓
tracked
   ↓
tracked
   ↓
tracked
```

Benefits:

- Smoother UI
- Less recognition computation
- Better temporal consistency
- More professional-looking real-time behavior

---

# 9. Session System

Attendance should belong to a session.

Create a session screen:

```text
NEW ATTENDANCE SESSION

Course
[ Data Structures ]

Section
[ CSE-A ]

Date
[ 28 Aug 2026 ]

Duration
[ 60 minutes ]

       [ START SESSION ]
```

When started:

```text
SESSION ACTIVE
─────────────────────
Data Structures
CSE-A

Present: 31 / 48

[ End Session ]
```

The session stores:

- Course
- Section
- Start time
- End time
- Status

---

# 10. Database Design

Use SQLite for the hackathon.

Do not waste time configuring PostgreSQL unless there is a compelling reason.

## students

```text
id
student_id
name
embedding
created_at
```

## sessions

```text
id
course
section
started_at
ended_at
status
```

## attendance

```text
id
session_id
student_id
timestamp
confidence
```

### Relationship

```text
Student
   │
   ├────────── Attendance
   │                │
   │                │
   └──────────── Session
```

---

# 11. FastAPI API Design

Keep the backend organized and professional.

```text
POST   /api/students
GET    /api/students
GET    /api/students/{id}
DELETE /api/students/{id}

POST   /api/sessions
GET    /api/sessions
GET    /api/sessions/{id}
POST   /api/sessions/{id}/end

POST   /api/recognition/frame

GET    /api/attendance/{session_id}

GET    /api/attendance/{session_id}/export
```

For the initial MVP, periodic frame requests can be used.

If time permits, upgrade live recognition to:

```text
WebSocket
    ↓
Camera frames
    ↓
Recognition engine
    ↓
Recognition events
    ↓
Frontend
```

---

# 12. Project Structure

Use a clean separation from the beginning.

```text
attendance-ai/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   │
│   │   ├── api/
│   │   │   ├── students.py
│   │   │   ├── sessions.py
│   │   │   ├── attendance.py
│   │   │   └── recognition.py
│   │   │
│   │   ├── cv/
│   │   │   ├── detector.py
│   │   │   ├── recognizer.py
│   │   │   ├── tracker.py
│   │   │   └── embeddings.py
│   │   │
│   │   ├── models/
│   │   │   ├── student.py
│   │   │   ├── session.py
│   │   │   └── attendance.py
│   │   │
│   │   ├── database.py
│   │   └── config.py
│   │
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── App.jsx
│   │
│   └── package.json
│
├── data/
│   └── .gitkeep
│
├── README.md
└── .gitignore
```

### Architecture rule

Do not put the whole application into `main.py`.

Keep:

```text
CV logic
≠
API logic
≠
Database logic
≠
Frontend logic
```

---

# 13. Dashboard UI

The interface should feel like an actual product rather than a college Python project.

Recommended sections:

```text
Dashboard
Students
Live Attendance
Sessions
Analytics
Settings
```

Main live screen:

```text
┌────────────────────────────────────────────────────────────┐
│  ATTENDANCE AI                            ● SYSTEM ONLINE   │
├──────────────┬─────────────────────────────────────────────┤
│              │                                             │
│ Dashboard    │ LIVE ATTENDANCE                             │
│              │                                             │
│ Students     │ ┌─────────────────────────┐  PRESENT        │
│              │ │                         │                 │
│ Sessions     │ │                         │  40 / 48        │
│              │ │        CAMERA           │                 │
│ Analytics    │ │                         │  83.3%          │
│              │ │     ┌───────┐           │                 │
│ Settings     │ │     │ ROHAN │           │                 │
│              │ │     └───────┘           │                 │
│              │ └─────────────────────────┘                 │
│              │                                             │
│              │ RECENTLY RECOGNIZED                         │
│              │ ✓ Rohan Vemuri       94%      10:42:31     │
│              │ ✓ Aman Sharma        91%      10:42:33     │
│              │ ✓ Priya Singh        89%      10:42:35     │
└──────────────┴─────────────────────────────────────────────┘
```

Prioritize the live screen over a fancy landing page.

---

# 14. Attendance Analytics

After ending a session:

```text
SESSION SUMMARY

Data Structures — CSE-A

48 Students

████████████████░░░░  83%

Present       40
Absent         8
Unknown        2

Session Duration
52 min

Average Recognition Confidence
93.4%
```

Add charts with Recharts.

Useful metrics:

- Total enrolled
- Present
- Absent
- Attendance percentage
- Unknown faces
- Average recognition confidence
- Session duration

---

# 15. Attendance History

Create a history page:

```text
ATTENDANCE HISTORY

Date        Course             Present
──────────────────────────────────────
28 Aug      Data Structures    40/48
27 Aug      Operating Systems  44/48
26 Aug      DBMS               42/48
25 Aug      Networks            39/48
```

Clicking a session should show:

```text
Data Structures
28 Aug 2026

Student              Status       Time
────────────────────────────────────────
Rohan Vemuri          PRESENT      10:42
Aman Sharma           PRESENT      10:43
Karan Singh           ABSENT       —
...
```

---

# 16. CSV Export

Add:

```text
[ ↓ Export CSV ]
```

Example:

```csv
student_id,name,status,timestamp,confidence
23BCS001,Rohan Vemuri,PRESENT,10:42:31,0.94
23BCS002,Aman Sharma,PRESENT,10:42:33,0.91
23BCS003,Karan Singh,ABSENT,,
```

This is easy to implement and makes the project much more useful.

---

# 17. Bonus Features

Only implement these **after the MVP works reliably**.

Priority order:

## 17.1 Face tracking

Highest-value bonus.

## 17.2 Unknown-face detection

Example:

```text
UNKNOWN PERSON

Confidence: 21%

Not enrolled
```

## 17.3 Attendance percentage per student

```text
Rohan Vemuri

Attendance
██████████████████░░  91%

Sessions attended: 20/22
```

## 17.4 Late detection

If the session starts at 10:00 and a student is first recognized at 10:07:

```text
LATE
```

## 17.5 Liveness / anti-spoofing

Only attempt this if there is enough time to implement and validate it properly.

Do not falsely claim advanced anti-spoofing just because a blink animation exists.

---

# 18. Features NOT Worth Building During the Hackathon

Do not burn time on:

- Authentication system
- Cloud deployment
- Microservices
- Kubernetes
- PostgreSQL
- Docker orchestration
- Fancy landing page
- Mobile application
- Custom neural network training
- Training your own face recognition model
- Building a CNN from scratch

The project is:

> **An application built around strong existing computer vision models.**

The differentiator is the complete system and user experience.

---

# 19. Implementation Order

This order is critical.

## Phase 1 — CV Engine

Build and test:

```text
Webcam
  ↓
Face detection
  ↓
Embedding
  ↓
Matching
  ↓
Name + confidence
```

Create a simple test script:

```bash
python test_recognition.py
```

Expected:

```text
[FACE] Rohan Vemuri — 0.93
[FACE] Aman Sharma — 0.89
[FACE] UNKNOWN — 0.31
```

Do not move on until this works.

---

## Phase 2 — Database

Implement:

```text
Student
Session
Attendance
```

Test the complete data flow:

```text
Enroll student
      ↓
Store embedding
      ↓
Start session
      ↓
Recognize
      ↓
Create attendance record
```

---

## Phase 3 — FastAPI

Build the REST API.

Make sure:

```text
/api/docs
```

works.

Test:

```text
POST /students
POST /sessions
POST /recognition/frame
GET /attendance
```

---

## Phase 4 — Frontend

Implement:

1. Live attendance
2. Enrollment
3. Session creation
4. Session history
5. Analytics
6. Export

The live attendance screen is the priority.

---

## Phase 5 — Tracking + Polish

Only after the complete MVP works:

- Add tracking
- Improve frame performance
- Improve UI
- Add transitions
- Add loading/error states
- Add unknown-face states
- Add confidence visualization
- Add responsive layout

---

# 20. Hackathon Timeline

Assuming work starts immediately:

| Time | Task |
|---|---|
| 0:00–0:30 | Project setup |
| 0:30–1:30 | Face detection + embeddings |
| 1:30–2:15 | Recognition + thresholds |
| 2:15–2:45 | SQLite |
| 2:45–3:30 | FastAPI |
| 3:30–5:00 | Live camera UI |
| 5:00–6:00 | Enrollment |
| 6:00–7:00 | Sessions + attendance |
| 7:00–8:00 | Dashboard |
| 8:00–8:30 | CSV/export |
| 8:30–9:30 | Tracking + polish |
| 9:30+ | Testing + demo rehearsal |

### Priority hierarchy

```text
1. RELIABILITY
       ↓
2. COMPLETE DEMO FLOW
       ↓
3. UI POLISH
       ↓
4. EXTRA FEATURES
```

A beautiful system that fails when three people enter the camera is worse than a simpler system that works flawlessly.

---

# 21. AI Coding Agent Strategy

This project is well suited to Cursor, Antigravity, Claude Code, or another coding agent.

Do **not** give an agent one giant prompt:

> "Build me a face recognition attendance system."

That tends to produce a huge, tightly coupled codebase that is difficult to debug.

Instead, implement one vertical slice at a time.

## Task 1 — CV

```text
Implement the CV recognition engine only.

Do not create frontend code.
Do not create API routes.

Implement enrollment, embedding generation,
similarity matching, confidence thresholds,
and tests demonstrating recognition.

Keep the CV engine modular.
```

## Task 2 — Database

```text
Implement SQLite models and repository logic.

Models:
- Student
- Session
- Attendance

Do not modify the existing CV engine.

Enforce unique attendance per student per session.
```

## Task 3 — FastAPI

```text
Implement FastAPI endpoints over the existing
CV and database services.

Do not duplicate business logic inside routes.
Keep route handlers thin.
```

## Task 4 — Frontend

```text
Implement the React live attendance page
against the existing API.

Do not rewrite backend logic.
Implement camera preview, face overlays,
attendance events, confidence display,
and session status.
```

## Task 5 — Analytics

```text
Implement session history, attendance details,
analytics, and CSV export.

Reuse the existing API and database layers.
Do not duplicate database logic in the frontend.
```

---

# 22. Persistent AI Context

Create a root-level:

```text
PROJECT_CONTEXT.md
```

Keep it updated.

Suggested contents:

```md
# Attendance AI

## Goal

Real-time classroom attendance using face recognition.

## Architecture

React → FastAPI → CV Engine → SQLite

## CV Pipeline

Face detection
→ Face alignment
→ ArcFace embeddings
→ Cosine similarity
→ Tracking
→ Attendance

## Rules

- Never mark a student twice in one session.
- Unknown faces must never be assigned to a student below threshold.
- CV logic must remain independent of FastAPI.
- Database access must remain independent of routes.
- Frontend communicates through API/WebSocket.
- Do not rewrite working modules without a reason.

## Current Status

[Keep updated]

## Known Bugs

[Keep updated]

## Next Task

[Keep updated]
```

This file acts as persistent project context when switching between coding agents.

---

# 23. Killer Demo

The demo should be extremely deliberate.

## Scene 1 — Open dashboard

Say:

> "We have 48 students enrolled."

## Scene 2 — Start session

Select:

```text
Data Structures
CSE-A
```

Start the session.

## Scene 3 — Multiple people enter frame

Three people enter the camera.

Immediately show:

```text
✓ Rohan — 96%
✓ Aman  — 93%
✓ Priya — 91%
```

Attendance changes:

```text
3 / 48 → PRESENT
```

## Scene 4 — Unknown person

Someone not enrolled enters.

System displays:

```text
? UNKNOWN
Confidence: 32%
```

No attendance is created.

## Scene 5 — Duplicate prevention

Rohan remains in frame or leaves and returns.

System recognizes him again but does not create a second attendance record.

Display:

```text
Attendance already recorded
```

## Scene 6 — End session

Click:

```text
End Session
```

Dashboard shows:

```text
40 Present
8 Absent
83.3% Attendance
```

## Scene 7 — Export

Click:

```text
Export CSV
```

Download the attendance record.

---

# 24. Technical Presentation Slide

Use a slide showing the pipeline:

```text
                    ATTENDANCE AI

Camera
  │
  ▼
Face Detection
  │
  ▼
Face Alignment
  │
  ▼
ArcFace Embedding
  │
  ▼
Cosine Similarity Matching
  │
  ├───────────────┐
  ▼               ▼
Known            Unknown
  │
  ▼
Face Tracking
  │
  ▼
Session Validation
  │
  ▼
Duplicate Prevention
  │
  ▼
Attendance Database
  │
  ▼
Analytics + CSV
```

Presentation line:

> "The system doesn't identify a student from a single image comparison. It converts enrolled faces into embeddings and performs similarity-based identity matching, with temporal tracking and session-level duplicate prevention."

---

# 25. Final Definition of Done

The project is ready for judging when all of the following work reliably:

## Computer Vision

- [ ] Webcam works
- [ ] Face detection works
- [ ] Multiple faces can be detected
- [ ] Enrollment works
- [ ] Embeddings are generated
- [ ] Known faces are recognized
- [ ] Unknown faces are rejected
- [ ] Confidence scores are shown
- [ ] Recognition is sufficiently real-time

## Attendance

- [ ] Sessions can be created
- [ ] Attendance is automatically recorded
- [ ] Duplicate attendance is prevented
- [ ] Timestamp is recorded
- [ ] Confidence is stored
- [ ] Session can be ended
- [ ] Present/absent totals are calculated

## Frontend

- [ ] Dashboard works
- [ ] Live camera works
- [ ] Bounding boxes work
- [ ] Enrollment page works
- [ ] Session controls work
- [ ] Attendance history works
- [ ] Analytics work
- [ ] CSV export works

## Quality

- [ ] No major crashes
- [ ] Errors have visible UI feedback
- [ ] Backend and frontend are separated
- [ ] CV logic is modular
- [ ] Database constraints prevent duplicates
- [ ] Demo has been rehearsed
- [ ] Demo can run offline/local if necessary

---

# 26. Final Strategy

Do not try to win by having the longest feature list.

Win by making the judge experience:

```text
                 CAMERA
                    ↓
              MULTIPLE FACES
                    ↓
            INSTANT RECOGNITION
                    ↓
          LIVE BOUNDING BOXES
                    ↓
          AUTOMATIC ATTENDANCE
                    ↓
          UNKNOWN FACE REJECTED
                    ↓
         DUPLICATES PREVENTED
                    ↓
             SESSION ENDS
                    ↓
              ANALYTICS
                    ↓
               CSV EXPORT
```

If this entire flow works smoothly while other teams are demonstrating a basic webcam script, the difference will be obvious.

**Reliability > features.  
Demo > architecture complexity.  
Polish > unnecessary technology.**
