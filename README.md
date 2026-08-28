# ◈ FaceLog (DrishtiAttendance AI)
> **Real-Time Edge Face Recognition & Attendance System**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Computer Vision](https://img.shields.io/badge/FaceNet-128D_WebGL-teal)](https://github.com/vladmandic/face-api)

---

## 🌟 Overview & Key Highlights
**FaceLog** is a production-grade, edge-computed computer vision attendance management platform. It replaces manual sign-in sheets and card swipes with sub-second neural facial recognition.

### 🚀 Core Capabilities
1. **Product Overview Homepage**:
   - Dual-tone dark-tech design (`#26d0ce` Teal & `#0d1b3e` Deep Navy) with `Fraunces` editorial typography.
   - Interactive biometric `FaceScanner` HUD canvas and live telemetry counters.
   - 3-step biometric process walkthrough and edge capability showcases.

2. **Real-Time Edge Live Scanner**:
   - WebGL GPU-accelerated face detection with sub-second inference speed ($< 0.3\text{s}$).
   - 68-Point facial landmark constellation mesh and holographic targeting frame.
   - **Strict $\ge 80\%$ Accuracy Threshold**: Calibrated Euclidean distance gating ($d \le 0.48$) preventing false-positive verifications.
   - Synthesized Web Audio multi-harmonic chime upon verified identification.

3. **Live Persistent Attendance Ledger**:
   - Multi-day calendar tabs (`Today`, `Yesterday`, `Wed 26 Aug`, etc.).
   - Real-time present / late / absent telemetry and dynamic percentage rates.
   - Full student inspection drawer with 5-day history and attendance progress bar.
   - Persistent `localStorage` database store syncing check-ins in real time.

4. **Biometric Enrollment Studio**:
   - 3-Step wizard (Details $\to$ Camera Face Scan with Oval Guide $\to$ Confirmation).
   - Real 128D FaceNet embedding extraction and portrait photo snapshot capture.

---

## 🏗️ Neural Pipeline

```
Camera / Video Stream (60 FPS)
        │
        ▼
TinyFace / SSD MobileNet Detector     ───▶  Bounding Boxes
        │
        ▼
68-Point Facial Landmark Net          ───▶  Affine Alignment & Constellation HUD
        │
        ▼
128D FaceNet Recognition Net          ───▶  Unit Vector Descriptor
        │
        ▼
Biometric Match Gate (≥80% Accuracy) ───▶  Euclidean Dist ≤ 0.48 ──▶ Log & Sync to DB
```

---

## 💻 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm run start
```
