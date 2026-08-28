function calculateIoU(box1, box2) {
  const xA = Math.max(box1.x, box2.x);
  const yA = Math.max(box1.y, box2.y);
  const xB = Math.min(box1.x + box1.width, box2.x + box2.width);
  const yB = Math.min(box1.y + box1.height, box2.y + box2.height);

  const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
  const box1Area = box1.width * box1.height;
  const box2Area = box2.width * box2.height;

  return interArea / (box1Area + box2Area - interArea + 1e-6);
}

export class MultiFaceTracker {
  constructor(iouThreshold = 0.3, maxStaleFrames = 5, lockCooldownMs = 15000) {
    this.tracks = new Map();
    this.iouThreshold = iouThreshold;
    this.maxStaleFrames = maxStaleFrames;
    this.lockCooldownMs = lockCooldownMs;
    this.nextTrackId = 1;
    this.sessionLoggedIds = new Set();
    this.lastLoggedTime = new Map();
  }

  update(detections, now = Date.now()) {
    const currentFrameMatches = [];

    // Mark all existing tracks as updated = false
    for (const track of this.tracks.values()) {
      track.updatedThisFrame = false;
    }

    for (const det of detections) {
      const box = det.detection?.box || det.box;
      const match = det.match;
      if (!box) continue;

      let bestTrack = null;
      let maxIoU = this.iouThreshold;

      for (const track of this.tracks.values()) {
        if (!track.updatedThisFrame) {
          const iou = calculateIoU(box, track.box);
          if (iou > maxIoU) {
            maxIoU = iou;
            bestTrack = track;
          }
        }
      }

      if (bestTrack) {
        bestTrack.box = box;
        bestTrack.staleFrames = 0;
        bestTrack.updatedThisFrame = true;

        if (match && match.label !== 'unknown') {
          bestTrack.matchedHistory.push(match.label);
          if (bestTrack.matchedHistory.length > 5) bestTrack.matchedHistory.shift();

          const counts = {};
          for (const id of bestTrack.matchedHistory) {
            counts[id] = (counts[id] || 0) + 1;
          }

          let topId = null;
          let topCount = 0;
          for (const [id, cnt] of Object.entries(counts)) {
            if (cnt > topCount) {
              topCount = cnt;
              topId = id;
            }
          }

          if (topCount >= 2 && topId) {
            bestTrack.lockedStudentId = topId;
            bestTrack.lastMatchDetails = match;
          }
        }
        currentFrameMatches.push(bestTrack);
      } else {
        const newTrackId = `track-${this.nextTrackId++}`;
        const newTrack = {
          trackId: newTrackId,
          box,
          matchedHistory: match && match.label !== 'unknown' ? [match.label] : [],
          lockedStudentId: null,
          lastMatchDetails: match || null,
          staleFrames: 0,
          updatedThisFrame: true,
          creationTime: now,
        };
        this.tracks.set(newTrackId, newTrack);
        currentFrameMatches.push(newTrack);
      }
    }

    // Prune stale tracks
    for (const [id, track] of Array.from(this.tracks.entries())) {
      if (!track.updatedThisFrame) {
        track.staleFrames += 1;
        if (track.staleFrames > this.maxStaleFrames) {
          this.tracks.delete(id);
        }
      }
    }

    return currentFrameMatches;
  }

  shouldTriggerLog(studentId, now = Date.now()) {
    if (!studentId || studentId === 'unknown') return false;
    const lastTime = this.lastLoggedTime.get(studentId) || 0;
    if (now - lastTime > this.lockCooldownMs) {
      this.lastLoggedTime.set(studentId, now);
      this.sessionLoggedIds.add(studentId);
      return true;
    }
    return false;
  }

  resetSession() {
    this.sessionLoggedIds.clear();
    this.lastLoggedTime.clear();
    this.tracks.clear();
  }
}
