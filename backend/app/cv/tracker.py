import time

class SimpleFaceTracker:
    def __init__(self, iou_threshold=0.3, max_age_seconds=2.0):
        self.tracked_faces = {}  # track_id -> dict
        self.next_track_id = 1
        self.iou_threshold = iou_threshold
        self.max_age_seconds = max_age_seconds

    def compute_iou(self, boxA, boxB):
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[0] + boxA[2], boxB[0] + boxB[2])
        yB = min(boxA[1] + boxA[3], boxB[1] + boxB[3])

        interArea = max(0, xB - xA) * max(0, yB - yA)
        boxAArea = boxA[2] * boxA[3]
        boxBArea = boxB[2] * boxB[3]

        iou = interArea / float(boxAArea + boxBArea - interArea + 1e-6)
        return iou

    def update(self, current_detections):
        """
        current_detections: list of dicts with 'box', 'name', 'confidence', 'student_id', etc.
        Returns list of detections with consistent 'track_id' and smoothed positions.
        """
        now = time.time()

        # Remove stale tracks
        expired_ids = [
            tid for tid, data in self.tracked_faces.items()
            if now - data['last_seen'] > self.max_age_seconds
        ]
        for tid in expired_ids:
            del self.tracked_faces[tid]

        updated_results = []

        for det in current_detections:
            box = det['box']
            best_iou = 0.0
            matched_id = None

            # Find best matching active track
            for tid, track in self.tracked_faces.items():
                iou = self.compute_iou(box, track['box'])
                if iou > best_iou:
                    best_iou = iou
                    matched_id = tid

            if matched_id is not None and best_iou >= self.iou_threshold:
                # Existing track match
                track = self.tracked_faces[matched_id]
                track['box'] = box
                track['last_seen'] = now
                if det.get('is_known'):
                    track['name'] = det.get('name')
                    track['student_id'] = det.get('student_id')
                    track['confidence'] = det.get('confidence')

                det['track_id'] = matched_id
                det['name'] = track.get('name', det.get('name'))
                det['student_id'] = track.get('student_id', det.get('student_id'))
            else:
                # Assign new track ID
                new_id = self.next_track_id
                self.next_track_id += 1
                self.tracked_faces[new_id] = {
                    'box': box,
                    'last_seen': now,
                    'name': det.get('name'),
                    'student_id': det.get('student_id'),
                    'confidence': det.get('confidence')
                }
                det['track_id'] = new_id

            updated_results.append(det)

        return updated_results
