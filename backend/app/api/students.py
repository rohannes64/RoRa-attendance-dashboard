import base64
import cv2
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.student import Student
from backend.app.cv.detector import FaceDetector
from backend.app.cv.embeddings import EmbeddingExtractor

router = APIRouter(prefix="/api/students", tags=["Students"])

detector = FaceDetector()
extractor = EmbeddingExtractor()

class StudentEnrollRequest(BaseModel):
    name: str
    student_id: str
    images_base64: List[str]  # List of base64 encoded images (Front, Left, Right)

class StudentResponse(BaseModel):
    id: int
    name: str
    student_id: str
    created_at: str

    class Config:
        from_attributes = True

@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def enroll_student(payload: StudentEnrollRequest, db: Session = Depends(get_db)):
    # Check if student ID already exists
    existing = db.query(Student).filter(Student.student_id == payload.student_id).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Student ID '{payload.student_id}' is already registered."
        )

    embeddings = []
    
    for idx, img_b64 in enumerate(payload.images_base64):
        try:
            # Decode base64 to numpy array
            if "," in img_b64:
                img_b64 = img_b64.split(",")[1]
            img_bytes = base64.b64decode(img_b64)
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if img is None:
                continue

            detected = detector.detect_faces(img)
            if detected:
                # Use largest/best detected face
                best_face = max(detected, key=lambda d: d['box'][2] * d['box'][3])
                crop = best_face['crop']
                emb = extractor.extract_embedding(crop)
                embeddings.append(emb)
            else:
                # Extract embedding directly from whole cropped region if tight face crop given
                emb = extractor.extract_embedding(img)
                embeddings.append(emb)
        except Exception as e:
            print(f"Error processing frame {idx}: {e}")

    if not embeddings:
        raise HTTPException(
            status_code=400,
            detail="No valid faces detected in the provided enrollment photos."
        )

    # Combine multi-angle embeddings into composite normalized vector
    composite_emb = extractor.compute_composite_embedding(embeddings)

    new_student = Student(
        name=payload.name.strip(),
        student_id=payload.student_id.strip()
    )
    new_student.set_embedding(composite_emb)

    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    return StudentResponse(
        id=new_student.id,
        name=new_student.name,
        student_id=new_student.student_id,
        created_at=new_student.created_at.strftime("%Y-%m-%d %H:%M:%S")
    )

@router.get("", response_model=List[StudentResponse])
def get_all_students(db: Session = Depends(get_db)):
    students = db.query(Student).order_by(Student.name.asc()).all()
    return [
        StudentResponse(
            id=s.id,
            name=s.name,
            student_id=s.student_id,
            created_at=s.created_at.strftime("%Y-%m-%d %H:%M:%S")
        )
        for s in students
    ]

@router.delete("/{id}")
def delete_student(id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    db.delete(student)
    db.commit()
    return {"message": "Student deleted successfully"}
