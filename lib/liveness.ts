// Anti-Spoofing and Liveness Verification Module
// Uses 68 facial landmark analysis to compute Eye Aspect Ratio (EAR), blink detection, and optical micro-variance.

export interface Point {
  x: number;
  y: number;
}

export interface LivenessState {
  lastBlinkTime: number;
  blinkCount: number;
  previousPositions: Point[];
  earHistory: number[];
  isCurrentlyBlinking: boolean;
  score: number;
}

export function createLivenessState(): LivenessState {
  return {
    lastBlinkTime: Date.now(),
    blinkCount: 0,
    previousPositions: [],
    earHistory: [],
    isCurrentlyBlinking: false,
    score: 85,
  };
}

/**
 * Euclidean distance between two 2D points
 */
function euclideanDist(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

/**
 * Calculates Eye Aspect Ratio (EAR) for 6 landmark points of an eye
 * Points: [p1 (left corner), p2 (top-left), p3 (top-right), p4 (right corner), p5 (bottom-right), p6 (bottom-left)]
 */
export function calculateEyeAspectRatio(eyePoints: Point[]): number {
  if (!eyePoints || eyePoints.length < 6) return 0.3;
  const p1 = eyePoints[0];
  const p2 = eyePoints[1];
  const p3 = eyePoints[2];
  const p4 = eyePoints[3];
  const p5 = eyePoints[4];
  const p6 = eyePoints[5];

  const vertical1 = euclideanDist(p2, p6);
  const vertical2 = euclideanDist(p3, p5);
  const horizontal = euclideanDist(p1, p4);

  if (horizontal === 0) return 0.3;
  return (vertical1 + vertical2) / (2.0 * horizontal);
}

/**
 * Evaluates liveness from 68 landmark points and historical motion tracking
 */
export function evaluateLiveness(
  landmarks: Point[],
  state: LivenessState
): { isLive: boolean; livenessScore: number; blinkDetected: boolean; updatedState: LivenessState } {
  if (!landmarks || landmarks.length < 68) {
    return { isLive: true, livenessScore: 70, blinkDetected: false, updatedState: state };
  }

  // Left Eye: indices 36 to 41
  const leftEye = landmarks.slice(36, 42);
  // Right Eye: indices 42 to 47
  const rightEye = landmarks.slice(42, 48);

  const leftEAR = calculateEyeAspectRatio(leftEye);
  const rightEAR = calculateEyeAspectRatio(rightEye);
  const avgEAR = (leftEAR + rightEAR) / 2.0;

  const earHistory = [...state.earHistory.slice(-15), avgEAR];
  const noseTip = landmarks[30];
  const prevPositions = [...state.previousPositions.slice(-10), noseTip];

  let blinkDetected = false;
  let isCurrentlyBlinking = state.isCurrentlyBlinking;
  let blinkCount = state.blinkCount;
  let lastBlinkTime = state.lastBlinkTime;

  // Thresholds for blink detection
  const BLINK_THRESHOLD = 0.22;
  if (avgEAR < BLINK_THRESHOLD && !isCurrentlyBlinking) {
    isCurrentlyBlinking = true;
  } else if (avgEAR >= BLINK_THRESHOLD && isCurrentlyBlinking) {
    isCurrentlyBlinking = false;
    blinkCount++;
    lastBlinkTime = Date.now();
    blinkDetected = true;
  }

  // Micro-motion calculation across consecutive frames
  let motionVariance = 0;
  if (prevPositions.length >= 4) {
    let totalDelta = 0;
    for (let i = 1; i < prevPositions.length; i++) {
      totalDelta += euclideanDist(prevPositions[i], prevPositions[i - 1]);
    }
    motionVariance = totalDelta / (prevPositions.length - 1);
  }

  // Time since last blink in seconds
  const secondsSinceBlink = (Date.now() - lastBlinkTime) / 1000;

  // Calculate composite liveness score (0 - 100%)
  let score = 92;
  // Natural eyes openness variance
  if (avgEAR > 0.18 && avgEAR < 0.42) {
    score += 5;
  }
  // If no blink in > 12 seconds, lower confidence slightly (might be static photo)
  if (secondsSinceBlink > 12) {
    score -= Math.min(25, Math.floor((secondsSinceBlink - 12) * 2));
  } else {
    score += 3;
  }

  // If micro-motion is present (natural breathing/head shake), boost score
  if (motionVariance > 0.2 && motionVariance < 45) {
    score += 4;
  } else if (motionVariance === 0 && prevPositions.length > 5) {
    // 100% frozen pixels = high probability of photo spoof
    score -= 30;
  }

  score = Math.max(10, Math.min(99, score));
  const isLive = score >= 55;

  const updatedState: LivenessState = {
    lastBlinkTime,
    blinkCount,
    previousPositions: prevPositions,
    earHistory,
    isCurrentlyBlinking,
    score,
  };

  return {
    isLive,
    livenessScore: score,
    blinkDetected,
    updatedState,
  };
}
