import sys
import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.database import engine, Base
from backend.app.api.students import router as students_router
from backend.app.api.sessions import router as sessions_router
from backend.app.api.recognition import router as recognition_router
from backend.app.api.attendance import router as attendance_router

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RoRa Attendance AI API",
    description="Real-Time Computer Vision Face Recognition Classroom Attendance Backend",
    version="1.0.0"
)

# Enable CORS for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(students_router)
app.include_router(sessions_router)
app.include_router(recognition_router)
app.include_router(attendance_router)

@app.get("/")
def root():
    return {
        "status": "online",
        "app": "RoRa Attendance AI",
        "version": "1.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
