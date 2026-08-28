import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR / 'attendance.db'}")

# Recognition Thresholds
SIMILARITY_THRESHOLD = 0.65  # Minimum cosine similarity for positive recognition
UNCERTAIN_THRESHOLD = 0.45   # Threshold between uncertain and unknown

# Face Detection Settings
FACE_MIN_SIZE = (60, 60)
EMBEDDING_DIM = 512
