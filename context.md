# ◈ FaceLog (DrishtiAttendance AI) — Codebase Context & Architecture Guide

> **For Future AI Agents & Developers**: This document provides the complete context, architectural map, design system rules, and technical specifications for the FaceLog codebase.

---

## 1. Executive Summary & Purpose

**FaceLog** is a production-grade, edge-computed, real-time facial recognition attendance system designed for educational institutions and organizations.

### Key Capabilities:
- **Real-Time Edge Computer Vision**: WebGL-accelerated FaceNet 128-dimensional biometric embeddings with sub-second inference speed ($< 0.3\text{s}$) running entirely in-browser.
- **Strict $\ge 80\%$ Accuracy Gate**: Enforces calibrated Euclidean distance thresholds ($d \le 0.48$) before verifying identity and logging attendance.
- **Persistent Live Attendance Database**: Synchronizes real-time check-in timestamps, status (`PRESENT` / `LATE` / `ABSENT`), duration, and analytics to local storage (`localStorage`) across all views.
- **Biometric Enrollment Studio**: 3-step wizard that captures facial portraits, extracts 128D neural descriptors, and immediately adds new profiles to the live recognition database.
- **Dual-Tone Editorial Design**: Faithful implementation of the Figma dark-tech visual language (`#26d0ce` Holographic Teal & `#0d1b3e` Deep Navy) with `Fraunces` and `DM Sans` typography.

---

## 2. Directory & Component Map

```
d:\hackathon\
├── app\
│   ├── globals.css              # Global styles, typography imports, keyframe animations
│   ├── layout.tsx               # Root Next.js layout, font preconnects, metadata
│   └── page.tsx                 # Root app shell: navigation, routing (home, scanner, attendance, enroll), state syncing
├── components\
│   └── figma\
│       ├── ProductHome.tsx      # Remodelled product homepage from mainHome.zip with interactive FaceScanner HUD
│       ├── LiveScanner.tsx      # Real-time camera scanner with Face-API, 68-point mesh HUD, 80%+ accuracy gate, live log
│       ├── AttendancePage.tsx   # Live attendance ledger, multi-day tabs, stats counters, search/filter, student history drawer
│       └── EnrollPage.tsx       # 3-step biometric enrollment wizard with real descriptor extraction & photo snapshot
├── lib\
│   ├── faceApi.ts               # Face-API computer vision engine (WebGL, TinyFace, Landmarks, 128D FaceNet, Euclidean distance)
│   ├── attendanceStore.ts       # Local database store (localStorage) for students, multi-day attendance records, and live logs
│   ├── audio.ts                 # Web Audio API synthesizer for melodic verification chimes and alert tones
│   └── liveness.ts              # Eye Aspect Ratio (EAR) blink detection & micro-motion anti-spoofing module
├── data\
│   ├── figmaData.ts             # Default dataset: 12 Indian students with 128D vectors and deterministic attendance records
│   ├── indianStudents.ts        # Extended student profiles dataset with roll numbers and branches
│   └── sessionsData.ts          # Institutional session presets (departments, classrooms, instructors)
├── public\
│   └── models\                  # Preloaded Face-API neural network model weights and manifests
├── scripts\
│   ├── capture_figma_pages.js   # Automated Playwright test capturing screenshots of all 3 main views
│   ├── capture_product_home.js  # Automated Playwright test capturing the product homepage
│   └── test_live_db_and_accuracy.js # Playwright integration test verifying 80%+ accuracy and live DB reflection
├── figma_export\                # Original Figma Make export (excluded from tsconfig)
└── home_export\                 # Original mainHome.zip export (excluded from tsconfig)
```

---

## 3. Design System & Tokens

The UI strictly adheres to the Figma design tokens:

| Token | Value / Font | Usage |
|---|---|---|
| **Primary Accent** | `#26d0ce` (Holographic Teal) | Accents, active nav items, success badges, holographic HUD frames, CTAs |
| **Deep Navy Background** | `#0d1b3e` | Main application background, hero gradient start |
| **Surface Dark** | `rgba(8,14,34,0.98)` / `rgba(10,18,42,0.97)` | Sidebar background, live log container, cards |
| **Mid Navy Gradient** | `#1a2980` | Hero and CTA card gradient stops |
| **Text Primary** | `#f0f6ff` | Headlines, student names, prominent labels |
| **Text Muted** | `rgba(240,246,255,0.4 - 0.7)` | Subtext, metadata, timestamps |
| **Font Display** | `'Fraunces', serif` | Logo title, section headings, numbers |
| **Font Body** | `'DM Sans', sans-serif` | General UI, tables, buttons, form controls |
| **Font Mono** | `'JetBrains Mono', monospace` | HUD coordinates, timestamps, confidence %, metrics |

---

## 4. Key Logic & Business Rules

### A. $\ge 80\%$ Accuracy Threshold
- Located in: [`components/figma/LiveScanner.tsx`](file:///d:/hackathon/components/figma/LiveScanner.tsx)
- **Math Formula**:
  $$\text{Confidence} = 1 - \frac{\text{EuclideanDistance}}{0.60}$$
- **Threshold Rule**:
  - If $\text{Confidence} \ge 0.80$ ($\text{Distance} \le 0.48$): **Verified Match**. Locks targeting HUD, sounds verification chime, logs student `IN` or `OUT`, and writes to database.
  - If $\text{Confidence} < 0.80$: **Rejected Identification**. HUD renders `LOW CONFIDENCE (< 80%)` to eliminate false positives.

### B. Live Database Synchronization
- Located in: [`lib/attendanceStore.ts`](file:///d:/hackathon/lib/attendanceStore.ts)
- Keys:
  - `facelog_enrolled_students_v1`: All student profiles (defaults + custom enrolled).
  - `facelog_attendance_records_v1`: Attendance records keyed by `studentId` and `date`.
  - `facelog_live_logs_v1`: Real-time scan event logs.
- When `LiveScanner` logs a student, `recordLiveAttendance()` writes directly to `attendanceRecords`. Switching to `AttendancePage` shows the updated status (`PRESENT` / `LATE`), check-in time, and daily attendance rate without page refresh.

### C. Biometric Enrollment
- Located in: [`components/figma/EnrollPage.tsx`](file:///d:/hackathon/components/figma/EnrollPage.tsx)
- Calls `extractSingleDescriptor(videoRef.current)` from `lib/faceApi.ts` to compute a real 128D FaceNet vector and captures a JPEG portrait snapshot.
- Stored student descriptors immediately participate in live camera matching.

---

## 5. Developer & Agent Guidelines

1. **Build Verification**:
   - Always run `npm run build` to verify 0 TypeScript/Next.js errors before concluding.
   - `tsconfig.json` MUST keep `"figma_export"` and `"home_export"` in the `exclude` array to prevent Vite import collisions.
2. **Server Port**:
   - Dev server runs on port `3000` via `next dev`.
   - On Windows, if port 3000 is locked, run:
     ```powershell
     Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
     ```
3. **Face-API Model Preloading**:
   - `loadFaceApiModels()` in `lib/faceApi.ts` preloads `tinyFaceDetector`, `faceLandmark68Net`, `faceLandmark68TinyNet`, and `faceRecognitionNet` in parallel.
   - Never remove `faceLandmark68TinyNet` loading to prevent runtime inference errors.
