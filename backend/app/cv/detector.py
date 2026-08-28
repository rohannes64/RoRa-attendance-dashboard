import cv2
import numpy as np
import os
from backend.app.config import FACE_MIN_SIZE

class FaceDetector:
    def __init__(self):
        self.cascade = None
        self.profile_cascade = None

        # Try initializing CascadeClassifier
        if hasattr(cv2, 'CascadeClassifier'):
            try:
                cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
                if os.path.exists(cascade_path):
                    self.cascade = cv2.CascadeClassifier(cascade_path)
            except Exception:
                pass

            try:
                profile_path = cv2.data.haarcascades + 'haarcascade_profileface.xml'
                if os.path.exists(profile_path):
                    self.profile_cascade = cv2.CascadeClassifier(profile_path)
            except Exception:
                pass

    def detect_faces(self, image: np.ndarray):
        """
        Detects faces in an RGB/BGR image numpy array.
        Returns list of dicts: [{'box': (x, y, w, h), 'confidence': float, 'crop': np.ndarray}]
        """
        if image is None or image.size == 0:
            return []

        img_h, img_w = image.shape[:2]
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        gray = cv2.equalizeHist(gray)
        detected = []

        # 1. Cascade Classifier detection
        if self.cascade is not None and not self.cascade.empty():
            frontal_boxes = self.cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=4,
                minSize=FACE_MIN_SIZE
            )
            for (x, y, w, h) in frontal_boxes:
                pad_w = int(w * 0.1)
                pad_h = int(h * 0.1)
                x1 = max(0, x - pad_w)
                y1 = max(0, y - pad_h)
                x2 = min(img_w, x + w + pad_w)
                y2 = min(img_h, y + h + pad_h)

                crop = image[y1:y2, x1:x2]
                laplacian_var = cv2.Laplacian(gray[y:y+h, x:x+w], cv2.CV_64F).var()
                confidence = min(0.99, max(0.75, laplacian_var / 400.0 + 0.75))

                detected.append({
                    'box': (int(x), int(y), int(w), int(h)),
                    'confidence': float(confidence),
                    'crop': crop
                })

        # 2. Skin Color / Ellipse / Contour Detection Fallback if no cascade match
        if not detected:
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV) if len(image.shape) == 3 else None
            if hsv is not None:
                # Skin color range in HSV space
                lower_skin = np.array([0, 20, 70], dtype=np.uint8)
                upper_skin = np.array([20, 255, 255], dtype=np.uint8)
                mask = cv2.inRange(hsv, lower_skin, upper_skin)

                # Morphological noise removal
                kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
                mask = cv2.erode(mask, kernel, iterations=2)
                mask = cv2.dilate(mask, kernel, iterations=2)
                mask = cv2.GaussianBlur(mask, (3, 3), 0)

                contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                for c in contours:
                    area = cv2.contourArea(c)
                    if area > (FACE_MIN_SIZE[0] * FACE_MIN_SIZE[1]):
                        x, y, w, h = cv2.boundingRect(c)
                        aspect_ratio = float(w) / float(h)
                        # Face aspect ratio is roughly 0.6 to 1.3
                        if 0.5 <= aspect_ratio <= 1.4:
                            crop = image[y:y+h, x:x+w]
                            detected.append({
                                'box': (int(x), int(y), int(w), int(h)),
                                'confidence': 0.72,
                                'crop': crop
                            })

        # Fallback to whole frame if small crop
        if not detected and img_w >= FACE_MIN_SIZE[0] and img_h >= FACE_MIN_SIZE[1]:
            # Center Region box
            w = int(img_w * 0.6)
            h = int(img_h * 0.6)
            x = int((img_w - w) / 2)
            y = int((img_h - h) / 2)
            detected.append({
                'box': (x, y, w, h),
                'confidence': 0.70,
                'crop': image[y:y+h, x:x+w]
            })

        return detected
