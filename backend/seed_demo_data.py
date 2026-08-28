import sys
import os
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database import SessionLocal, engine, Base
from backend.app.models.student import Student
from backend.app.models.session import Session as ClassroomSession
from backend.app.models.attendance import Attendance
from datetime import datetime, timedelta

Base.metadata.create_all(bind=engine)
db = SessionLocal()

def seed():
    # Clear existing if any
    db.query(Attendance).delete()
    db.query(ClassroomSession).delete()
    db.query(Student).delete()
    db.commit()

    # Create sample embeddings
    emb_rohan = np.random.randn(512)
    emb_rohan = (emb_rohan / np.linalg.norm(emb_rohan)).tolist()

    emb_aman = np.random.randn(512)
    emb_aman = (emb_aman / np.linalg.norm(emb_aman)).tolist()

    emb_priya = np.random.randn(512)
    emb_priya = (emb_priya / np.linalg.norm(emb_priya)).tolist()

    s1 = Student(name="Rohan Vemuri", student_id="23BCS001")
    s1.set_embedding(emb_rohan)

    s2 = Student(name="Aman Sharma", student_id="23BCS002")
    s2.set_embedding(emb_aman)

    s3 = Student(name="Priya Singh", student_id="23BCS003")
    s3.set_embedding(emb_priya)

    db.add_all([s1, s2, s3])
    db.commit()

    # Create sample past session
    past_session = ClassroomSession(
        course="Data Structures",
        section="CSE-A",
        started_at=datetime.utcnow() - timedelta(hours=2),
        ended_at=datetime.utcnow() - timedelta(hours=1),
        status="ENDED"
    )
    db.add(past_session)
    db.commit()
    db.refresh(past_session)

    # Add sample attendance records
    att1 = Attendance(
        session_id=past_session.id,
        student_id="23BCS001",
        confidence=96.4,
        timestamp=datetime.utcnow() - timedelta(hours=1, minutes=55)
    )
    att2 = Attendance(
        session_id=past_session.id,
        student_id="23BCS002",
        confidence=92.1,
        timestamp=datetime.utcnow() - timedelta(hours=1, minutes=52)
    )
    db.add_all([att1, att2])
    db.commit()

    print("Demo data seeded successfully:")
    print(" - Students: Rohan Vemuri (23BCS001), Aman Sharma (23BCS002), Priya Singh (23BCS003)")
    print(" - Past Session: Data Structures (CSE-A) with 2/3 Present (66.7%)")

    db.close()

if __name__ == "__main__":
    seed()
