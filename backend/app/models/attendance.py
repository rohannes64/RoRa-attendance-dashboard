from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from backend.app.database import Base

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False, index=True)
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    confidence = Column(Float, nullable=False)

    __table_args__ = (
        UniqueConstraint('session_id', 'student_id', name='_session_student_uc'),
    )
