import type { Student } from '../data/figmaData';
import { calculateIoU, type BoundingBox } from './faceApi';

export interface FaceTrack {
  trackId: string;
  box: BoundingBox;
  dots: { x: number; y: number }[];
  matchedStudent: Student | null;
  confidence: number;
  distance: number;
  label: string;
  matchCount: number;
  isLocked: boolean;
  loggedTime: number | null;
  lastSeen: number;
}

export interface DetectionInput {
  box: BoundingBox;
  dots: { x: number; y: number }[];
  matchedStudent: Student | null;
  confidence: number;
  distance: number;
}

export class MultiFaceTracker {
  private tracks: Map<string, FaceTrack> = new Map();
  private nextTrackId = 1;
  private sessionCooldowns: Map<string, number> = new Map(); // studentId -> timestamp of last log
  private readonly iouThreshold: number;
  private readonly maxInactiveMs: number;
  private readonly minMatchConsensus: number;
  private readonly sessionCooldownMs: number;

  constructor(
    iouThreshold: number = 0.25,
    minMatchConsensus: number = 2,
    sessionCooldownMs: number = 15000,
    maxInactiveMs: number = 1500
  ) {
    this.iouThreshold = iouThreshold;
    this.minMatchConsensus = minMatchConsensus;
    this.sessionCooldownMs = sessionCooldownMs;
    this.maxInactiveMs = maxInactiveMs;
  }

  /**
   * Updates tracks with new detections from the current video frame
   * Returns list of students that were verified & confirmed in this frame
   */
  public update(detections: DetectionInput[]): {
    tracks: FaceTrack[];
    newlyVerified: { student: Student; confidence: number }[];
  } {
    const now = Date.now();
    const updatedTrackIds = new Set<string>();
    const newlyVerified: { student: Student; confidence: number }[] = [];

    // 1. Associate detections to existing tracks via IoU
    const unassignedDetections: DetectionInput[] = [];

    for (const det of detections) {
      let bestTrackId: string | null = null;
      let maxIoU = 0;

      for (const [trackId, track] of this.tracks.entries()) {
        const iou = calculateIoU(det.box, track.box);
        if (iou > maxIoU && iou >= this.iouThreshold) {
          maxIoU = iou;
          bestTrackId = trackId;
        }
      }

      if (bestTrackId) {
        // Update existing track
        updatedTrackIds.add(bestTrackId);
        const track = this.tracks.get(bestTrackId)!;

        // Smooth box coordinates (exponential moving average for smooth HUD rendering)
        track.box = {
          x: Math.round(track.box.x * 0.3 + det.box.x * 0.7),
          y: Math.round(track.box.y * 0.3 + det.box.y * 0.7),
          width: Math.round(track.box.width * 0.3 + det.box.width * 0.7),
          height: Math.round(track.box.height * 0.3 + det.box.height * 0.7),
        };
        track.dots = det.dots;
        track.lastSeen = now;

        const isMatchEligible = det.matchedStudent && det.confidence >= 0.80;

        if (isMatchEligible && det.matchedStudent) {
          if (track.matchedStudent?.id === det.matchedStudent.id) {
            track.matchCount += 1;
          } else {
            track.matchedStudent = det.matchedStudent;
            track.matchCount = 1;
          }

          track.confidence = det.confidence;
          track.distance = det.distance;
          track.label = `MATCH ${(det.confidence * 100).toFixed(1)}%`;

          // Check if eligible for identity lock & log dispatch
          if (track.matchCount >= this.minMatchConsensus && !track.isLocked) {
            const lastLogged = this.sessionCooldowns.get(det.matchedStudent.id) || 0;
            if (now - lastLogged >= this.sessionCooldownMs) {
              track.isLocked = true;
              track.loggedTime = now;
              this.sessionCooldowns.set(det.matchedStudent.id, now);
              newlyVerified.push({ student: det.matchedStudent, confidence: det.confidence });
            } else {
              // Recently logged, retain locked visual state without duplicate log
              track.isLocked = true;
            }
          }
        } else if (det.matchedStudent && det.confidence < 0.80) {
          track.confidence = det.confidence;
          track.distance = det.distance;
          track.label = `LOW CONFIDENCE (${(det.confidence * 100).toFixed(0)}% < 80%)`;
          if (!track.isLocked) {
            track.matchCount = 0;
          }
        } else {
          track.confidence = det.confidence;
          track.label = 'ANALYZING…';
          if (!track.isLocked) {
            track.matchCount = 0;
          }
        }
      } else {
        unassignedDetections.push(det);
      }
    }

    // 2. Create new tracks for unassigned detections
    for (const det of unassignedDetections) {
      const trackId = `track-${this.nextTrackId++}`;
      updatedTrackIds.add(trackId);

      const isMatch = det.matchedStudent && det.confidence >= 0.80;
      const initialLabel = isMatch
        ? `MATCH ${(det.confidence * 100).toFixed(1)}%`
        : det.matchedStudent
        ? `LOW CONFIDENCE (${(det.confidence * 100).toFixed(0)}% < 80%)`
        : 'ANALYZING…';

      const newTrack: FaceTrack = {
        trackId,
        box: det.box,
        dots: det.dots,
        matchedStudent: det.matchedStudent,
        confidence: det.confidence,
        distance: det.distance,
        label: initialLabel,
        matchCount: isMatch ? 1 : 0,
        isLocked: false,
        loggedTime: null,
        lastSeen: now,
      };

      this.tracks.set(trackId, newTrack);
    }

    // 3. Purge inactive tracks that left the video viewport
    for (const [trackId, track] of this.tracks.entries()) {
      if (now - track.lastSeen > this.maxInactiveMs) {
        this.tracks.delete(trackId);
      }
    }

    return {
      tracks: Array.from(this.tracks.values()),
      newlyVerified,
    };
  }

  /**
   * Helper method to check and update session cooldown for a student ID
   */
  public shouldTriggerLog(studentId: string): boolean {
    const now = Date.now();
    const lastLogged = this.sessionCooldowns.get(studentId) || 0;
    if (now - lastLogged >= this.sessionCooldownMs) {
      this.sessionCooldowns.set(studentId, now);
      return true;
    }
    return false;
  }

  /**
   * Resets active tracks and session locks
   */
  public reset() {
    this.tracks.clear();
    this.sessionCooldowns.clear();
  }
}
