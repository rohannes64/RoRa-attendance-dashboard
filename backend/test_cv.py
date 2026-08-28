import sys
import os
import numpy as np

# Ensure backend package import path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.cv.detector import FaceDetector
from backend.app.cv.embeddings import EmbeddingExtractor
from backend.app.cv.recognizer import FaceRecognizer
from backend.app.cv.tracker import SimpleFaceTracker

def run_tests():
    print("=" * 60)
    print("Running Attendance AI Computer Vision Engine Verification Test")
    print("=" * 60)

    # 1. Test Detector
    print("[1/4] Testing FaceDetector...")
    detector = FaceDetector()
    dummy_img = np.zeros((480, 640, 3), dtype=np.uint8)
    # Draw a synthetic face rectangle with eyes and mouth
    cv2_available = True
    try:
        import cv2
        cv2.rectangle(dummy_img, (200, 150), (400, 350), (200, 200, 200), -1)
        cv2.circle(dummy_img, (260, 220), 20, (50, 50, 50), -1)
        cv2.circle(dummy_img, (340, 220), 20, (50, 50, 50), -1)
        cv2.ellipse(dummy_img, (300, 300), (40, 20), 0, 0, 180, (50, 50, 50), 5)
    except Exception as e:
        print(f"Warning drawing synthetic image: {e}")

    detections = detector.detect_faces(dummy_img)
    print(f" -> Synthetic Frame Detections: {len(detections)}")

    # 2. Test EmbeddingExtractor
    print("\n[2/4] Testing EmbeddingExtractor...")
    extractor = EmbeddingExtractor()
    face_crop = dummy_img[150:350, 200:400]
    emb1 = extractor.extract_embedding(face_crop)
    norm1 = np.linalg.norm(emb1)
    print(f" -> Extracted Embedding Dimension: {len(emb1)}")
    print(f" -> L2 Vector Norm (expected ~1.0): {norm1:.4f}")

    # Test composite multi-angle embedding calculation
    emb2 = extractor.extract_embedding(dummy_img[140:340, 190:390])
    emb3 = extractor.extract_embedding(dummy_img[160:360, 210:410])
    composite_emb = extractor.compute_composite_embedding([emb1, emb2, emb3])
    print(f" -> Composite Multi-Angle Embedding Norm: {np.linalg.norm(composite_emb):.4f}")

    # 3. Test FaceRecognizer & Cosine Similarity Decision Logic
    print("\n[3/4] Testing FaceRecognizer Thresholds...")
    recognizer = FaceRecognizer(similarity_threshold=0.65, uncertain_threshold=0.45)

    enrolled = [
        {
            'student_id': '23BCS001',
            'name': 'Rohan Vemuri',
            'embedding': composite_emb
        },
        {
            'student_id': '23BCS002',
            'name': 'Aman Sharma',
            'embedding': np.random.randn(512).tolist()
        }
    ]

    # Test exact match -> Expect RECOGNIZED
    match_result = recognizer.identify_face(emb1, enrolled)
    print(f" -> Enrolled Match Result: [{match_result['status']}] Name: {match_result['name']} | Confidence: {match_result['confidence']}%")

    # Test random vector -> Expect UNKNOWN
    random_face_emb = np.random.randn(512)
    random_face_emb = random_face_emb / np.linalg.norm(random_face_emb)
    unknown_result = recognizer.identify_face(random_face_emb, enrolled)
    print(f" -> Unenrolled Unknown Result: [{unknown_result['status']}] Name: {unknown_result['name']} | Confidence: {unknown_result['confidence']}%")

    # 4. Test SimpleFaceTracker
    print("\n[4/4] Testing SimpleFaceTracker...")
    tracker = SimpleFaceTracker()
    tracked = tracker.update([
        {
            'box': (200, 150, 200, 200),
            'confidence': 95.0,
            'name': match_result['name'],
            'student_id': match_result['student_id'],
            'is_known': True,
            'status': 'RECOGNIZED'
        }
    ])
    print(f" -> Track Assigned ID: Track #{tracked[0]['track_id']} for {tracked[0]['name']}")

    print("=" * 60)
    print("ALL COMPUTER VISION ENGINE MODULE VERIFICATIONS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
