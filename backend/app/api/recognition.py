import base64
import cv2
import numpy as np
from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from backend.app.database import get_db
from backend.app.models.student import Student
from backend.app.models.session import Session as ClassroomSession
from backend.app.models.attendance import Attendance
from backend.app.cv.detector import FaceDetector
from backend.app.cv.embeddings import EmbeddingExtractor
from backend.app.cv.recognizer import FaceRecognizer
from backend.app.cv.tracker import SimpleFaceTracker

router = APIRouter(prefix="/api/recognition", tags=["Recognition"])

detector = FaceDetector()
extractor = EmbeddingExtractor()
recognizer = FaceRecognizer()
tracker = SimpleFaceTracker()

class FrameRequest(BaseModel):
    image_base64: str

class FaceDetectionResult(BaseModel):
    box: List[int]  # [x, y, w, h]
    confidence: float
    student_id: Optional[str] = None
    name: str
    is_known: bool
    status: str
    attendance_recorded: bool = False
    track_id: Optional[int] = None

class FrameResponse(BaseModel):
    faces: List[FaceDetectionResult]
    active_session_id: Optional[int] = None
    new_attendance_events: List[dict] = []

@router.post("/frame", response_model=FrameResponse)
def process_frame(payload: FrameRequest, db: Session = Depends(get_db)):
    img_b64 = payload.image_base64
    if "," in img_b64:
        img_b64 = img_b64.split(",")[1]

    try:
        img_bytes = base64.b64decode(img_b64)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception:
        return FrameResponse(faces=[])

    if img is None:
        return FrameResponse(faces=[])

    active_session = db.query(ClassroomSession).filter(ClassroomSession.status == "ACTIVE").first()
    active_session_id = active_session.id if active_session else None

    db_students = db.query(Student).all()
    enrolled_data = [
        {
            'student_id': s.student_id,
            'name': s.name,
            'embedding': s.get_embedding()
        }
        for s in db_students
    ]

    raw_detections = detector.detect_faces(img)
    target_embeddings = [extractor.extract_embedding(det['crop']) for det in raw_detections]

    # Batch global matching guaranteeing 1-to-1 unique identity assignment per frame
    id_results = recognizer.identify_multiple_faces(target_embeddings, enrolled_data)

    processed_faces = []
    new_events = []

    for idx, det in enumerate(raw_detections):
        id_result = id_results[idx]

        face_res = {
            'box': list(det['box']),
            'confidence': id_result['confidence'],
            'student_id': id_result['student_id'],
            'name': id_result['name'],
            'is_known': id_result['is_known'],
            'status': id_result['status'],
            'attendance_recorded': False
        }

        # Auto-record attendance for recognized students during active session
        if active_session_id and id_result['is_known'] and id_result['student_id']:
            student_id = id_result['student_id']
            existing = db.query(Attendance).filter(
                Attendance.session_id == active_session_id,
                Attendance.student_id == student_id
            ).first()

            if not existing:
                try:
                    att = Attendance(
                        session_id=active_session_id,
                        student_id=student_id,
                        confidence=id_result['confidence'],
                        timestamp=datetime.utcnow()
                    )
                    db.add(att)
                    db.commit()
                    face_res['attendance_recorded'] = True
                    new_events.append({
                        'student_id': student_id,
                        'name': id_result['name'],
                        'time': att.timestamp.strftime("%H:%M:%S"),
                        'confidence': id_result['confidence']
                    })
                except IntegrityError:
                    db.rollback()
                    face_res['attendance_recorded'] = False

        processed_faces.append(face_res)

    tracked_faces = tracker.update(processed_faces)

    results = [
        FaceDetectionResult(
            box=tf['box'],
            confidence=tf['confidence'],
            student_id=tf.get('student_id'),
            name=tf['name'],
            is_known=tf['is_known'],
            status=tf['status'],
            attendance_recorded=tf.get('attendance_recorded', False),
            track_id=tf.get('track_id')
        )
        for tf in tracked_faces
    ]

    return FrameResponse(
        faces=results,
        active_session_id=active_session_id,
        new_attendance_events=new_events
    )
