import cv2
import numpy as np
from backend.app.config import EMBEDDING_DIM

class EmbeddingExtractor:
    def __init__(self):
        self.embedding_dim = EMBEDDING_DIM

    def extract_embedding(self, face_crop: np.ndarray) -> np.ndarray:
        """
        Extracts a normalized 512-dimensional facial feature vector from a face crop.
        """
        if face_crop is None or face_crop.size == 0:
            return np.zeros(self.embedding_dim, dtype=np.float32)

        # Standardize face crop dimensions (112x112)
        resized = cv2.resize(face_crop, (112, 112))
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)

        # Extract multi-scale texture and spatial frequency features
        features = []
        
        # 1. Multi-grid mean and standard deviations
        for grid_size in [4, 8, 16]:
            h, w = gray.shape
            gh, gw = h // grid_size, w // grid_size
            for i in range(grid_size):
                for j in range(grid_size):
                    cell = gray[i*gh:(i+1)*gh, j*gw:(j+1)*gw]
                    features.append(np.mean(cell))
                    features.append(np.std(cell))

        # 2. Local Binary Pattern (LBP) histogram features
        radius = 1
        n_points = 8
        h, w = gray.shape
        lbp_grid = np.zeros((h - 2, w - 2), dtype=np.uint8)
        for i in range(1, h - 1):
            for j in range(1, w - 1):
                center = gray[i, j]
                code = 0
                code |= (gray[i-1, j-1] >= center) << 7
                code |= (gray[i-1, j]   >= center) << 6
                code |= (gray[i-1, j+1] >= center) << 5
                code |= (gray[i, j+1]   >= center) << 4
                code |= (gray[i+1, j+1] >= center) << 3
                code |= (gray[i+1, j]   >= center) << 2
                code |= (gray[i+1, j-1] >= center) << 1
                code |= (gray[i, j-1]   >= center) << 0
                lbp_grid[i-1, j-1] = code
        
        hist, _ = np.histogram(lbp_grid.ravel(), bins=128, range=(0, 256))
        features.extend(hist.astype(np.float32))

        # 3. Spatial Gradient Histogram (Sobel Gx, Gy)
        sobelx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
        magnitude, angle = cv2.cartToPolar(sobelx, sobely, angleInDegrees=True)

        mag_hist, _ = np.histogram(magnitude.ravel(), bins=64)
        ang_hist, _ = np.histogram(angle.ravel(), bins=64, range=(0, 360))
        features.extend(mag_hist.astype(np.float32))
        features.extend(ang_hist.astype(np.float32))

        vec = np.array(features, dtype=np.float32)

        # Truncate or pad to exactly EMBEDDING_DIM
        if len(vec) > self.embedding_dim:
            vec = vec[:self.embedding_dim]
        elif len(vec) < self.embedding_dim:
            vec = np.pad(vec, (0, self.embedding_dim - len(vec)), mode='constant')

        # L2 Normalization: ||vec||_2 = 1
        norm = np.linalg.norm(vec)
        if norm > 1e-6:
            vec = vec / norm
        else:
            vec = np.zeros(self.embedding_dim, dtype=np.float32)

        return vec

    def compute_composite_embedding(self, embeddings_list: list) -> list:
        """
        Combines multiple face embeddings (e.g., front, left, right enrollment captures)
        via mean vector calculation and L2 normalization.
        """
        if not embeddings_list:
            return [0.0] * self.embedding_dim

        arr = np.array(embeddings_list, dtype=np.float32)
        mean_vec = np.mean(arr, axis=0)
        
        # L2 Normalize
        norm = np.linalg.norm(mean_vec)
        if norm > 1e-6:
            mean_vec = mean_vec / norm

        return mean_vec.tolist()
