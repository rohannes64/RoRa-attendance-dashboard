from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from backend.app.database import Base

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    course = Column(String, nullable=False)
    section = Column(String, nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    status = Column(String, default="ACTIVE")  # ACTIVE, ENDED
