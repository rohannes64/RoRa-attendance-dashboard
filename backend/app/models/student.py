import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from backend.app.database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    embedding_json = Column(Text, nullable=False)  # JSON-encoded 512d float vector
    created_at = Column(DateTime, default=datetime.utcnow)

    def set_embedding(self, embedding_list):
        self.embedding_json = json.dumps(embedding_list)

    def get_embedding(self):
        return json.loads(self.embedding_json) if self.embedding_json else []
