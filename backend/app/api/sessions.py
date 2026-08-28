from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.session import Session as ClassroomSession
from backend.app.models.student import Student
from backend.app.models.attendance import Attendance

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])

class SessionCreate(BaseModel):
    course: str
    section: str

class SessionResponse(BaseModel):
    id: int
    course: str
    section: str
    started_at: str
    ended_at: Optional[str] = None
    status: str
    total_enrolled: int = 0
    present_count: int = 0
    absent_count: int = 0
    attendance_percentage: float = 0.0

@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(payload: SessionCreate, db: Session = Depends(get_db)):
    # Check if there is already an ACTIVE session; if so, close it
    active_session = db.query(ClassroomSession).filter(ClassroomSession.status == "ACTIVE").first()
    if active_session:
        active_session.status = "ENDED"
        active_session.ended_at = datetime.utcnow()
        db.commit()

    new_session = ClassroomSession(
        course=payload.course.strip(),
        section=payload.section.strip(),
        started_at=datetime.utcnow(),
        status="ACTIVE"
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    total_enrolled = db.query(Student).count()

    return SessionResponse(
        id=new_session.id,
        course=new_session.course,
        section=new_session.section,
        started_at=new_session.started_at.strftime("%Y-%m-%d %H:%M:%S"),
        status=new_session.status,
        total_enrolled=total_enrolled,
        present_count=0,
        absent_count=total_enrolled,
        attendance_percentage=0.0
    )

@router.get("/active/current")
def get_current_active_session(db: Session = Depends(get_db)):
    session = db.query(ClassroomSession).filter(ClassroomSession.status == "ACTIVE").first()
    if not session:
        return {"active": False, "session": None}

    total_enrolled = db.query(Student).count()
    present_count = db.query(Attendance).filter(Attendance.session_id == session.id).count()
    absent_count = max(0, total_enrolled - present_count)
    pct = round((present_count / total_enrolled * 100), 1) if total_enrolled > 0 else 0.0

    return {
        "active": True,
        "session": SessionResponse(
            id=session.id,
            course=session.course,
            section=session.section,
            started_at=session.started_at.strftime("%Y-%m-%d %H:%M:%S"),
            ended_at=session.ended_at.strftime("%Y-%m-%d %H:%M:%S") if session.ended_at else None,
            status=session.status,
            total_enrolled=total_enrolled,
            present_count=present_count,
            absent_count=absent_count,
            attendance_percentage=pct
        )
    }

@router.post("/{session_id}/end")
def end_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ClassroomSession).filter(ClassroomSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "ENDED"
    session.ended_at = datetime.utcnow()
    db.commit()

    return {"message": "Session ended successfully"}

@router.get("", response_model=List[SessionResponse])
def get_all_sessions(db: Session = Depends(get_db)):
    sessions = db.query(ClassroomSession).order_by(ClassroomSession.started_at.desc()).all()
    total_enrolled = db.query(Student).count()
    
    result = []
    for s in sessions:
        present_count = db.query(Attendance).filter(Attendance.session_id == s.id).count()
        absent_count = max(0, total_enrolled - present_count)
        pct = round((present_count / total_enrolled * 100), 1) if total_enrolled > 0 else 0.0

        result.append(SessionResponse(
            id=s.id,
            course=s.course,
            section=s.section,
            started_at=s.started_at.strftime("%Y-%m-%d %H:%M:%S"),
            ended_at=s.ended_at.strftime("%Y-%m-%d %H:%M:%S") if s.ended_at else None,
            status=s.status,
            total_enrolled=total_enrolled,
            present_count=present_count,
            absent_count=absent_count,
            attendance_percentage=pct
        ))
    return result

@router.get("/{session_id}")
def get_session_details(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ClassroomSession).filter(ClassroomSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    students = db.query(Student).all()
    attendance_records = {
        a.student_id: a for a in db.query(Attendance).filter(Attendance.session_id == session_id).all()
    }

    student_list = []
    for st in students:
        rec = attendance_records.get(st.student_id)
        student_list.append({
            "student_id": st.student_id,
            "name": st.name,
            "status": "PRESENT" if rec else "ABSENT",
            "timestamp": rec.timestamp.strftime("%H:%M:%S") if rec else None,
            "confidence": rec.confidence if rec else None
        })

    present_cnt = len(attendance_records)
    total_cnt = len(students)
    absent_cnt = max(0, total_cnt - present_cnt)
    pct = round((present_cnt / total_cnt * 100), 1) if total_cnt > 0 else 0.0

    return {
        "session": {
            "id": session.id,
            "course": session.course,
            "section": session.section,
            "started_at": session.started_at.strftime("%Y-%m-%d %H:%M:%S"),
            "ended_at": session.ended_at.strftime("%Y-%m-%d %H:%M:%S") if session.ended_at else None,
            "status": session.status,
            "total_enrolled": total_cnt,
            "present_count": present_cnt,
            "absent_count": absent_cnt,
            "attendance_percentage": pct
        },
        "students": student_list
    }
