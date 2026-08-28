from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List

from backend.app.database import get_db
from backend.app.models.student import Student
from backend.app.models.session import Session as ClassroomSession
from backend.app.models.attendance import Attendance

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])

@router.get("/{session_id}")
def get_session_attendance(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ClassroomSession).filter(ClassroomSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    records = db.query(Attendance, Student)\
        .join(Student, Attendance.student_id == Student.student_id)\
        .filter(Attendance.session_id == session_id)\
        .order_by(Attendance.timestamp.desc())\
        .all()

    return [
        {
            "id": att.id,
            "student_id": student.student_id,
            "name": student.name,
            "timestamp": att.timestamp.strftime("%H:%M:%S"),
            "confidence": att.confidence
        }
        for att, student in records
    ]

@router.get("/{session_id}/export")
def export_session_attendance_csv(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ClassroomSession).filter(ClassroomSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    all_students = db.query(Student).order_by(Student.name.asc()).all()
    attendance_map = {
        att.student_id: att for att in db.query(Attendance).filter(Attendance.session_id == session_id).all()
    }

    lines = ["student_id,name,status,timestamp,confidence\n"]

    for st in all_students:
        att = attendance_map.get(st.student_id)
        status = "PRESENT" if att else "ABSENT"
        time_str = att.timestamp.strftime("%H:%M:%S") if att else ""
        conf_str = str(att.confidence) if att else ""
        lines.append(f"{st.student_id},{st.name},{status},{time_str},{conf_str}\n")

    csv_content = "".join(lines)
    filename = f"attendance_{session.course.replace(' ', '_')}_{session.section}_{session.id}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/analytics/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    total_students = db.query(Student).count()
    total_sessions = db.query(ClassroomSession).count()
    total_attendance_logs = db.query(Attendance).count()

    sessions = db.query(ClassroomSession).all()
    session_stats = []

    for s in sessions:
        p_cnt = db.query(Attendance).filter(Attendance.session_id == s.id).count()
        pct = round((p_cnt / total_students * 100), 1) if total_students > 0 else 0.0
        session_stats.append({
            "id": s.id,
            "course": s.course,
            "section": s.section,
            "date": s.started_at.strftime("%b %d"),
            "present": p_cnt,
            "total": total_students,
            "percentage": pct
        })

    avg_pct = round(sum(s['percentage'] for s in session_stats) / len(session_stats), 1) if session_stats else 0.0

    return {
        "total_students": total_students,
        "total_sessions": total_sessions,
        "total_attendance_logs": total_attendance_logs,
        "average_attendance_rate": avg_pct,
        "recent_sessions": session_stats[-5:]
    }
