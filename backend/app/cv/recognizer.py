import numpy as np
from backend.app.config import SIMILARITY_THRESHOLD, UNCERTAIN_THRESHOLD

class FaceRecognizer:
    def __init__(self, similarity_threshold=SIMILARITY_THRESHOLD, uncertain_threshold=UNCERTAIN_THRESHOLD):
        self.similarity_threshold = similarity_threshold
        self.uncertain_threshold = uncertain_threshold

    def calculate_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """
        Calculates Cosine Similarity between two feature vectors.
        For L2 normalized vectors, similarity = dot product.
        """
        v1 = np.array(vec1, dtype=np.float32)
        v2 = np.array(vec2, dtype=np.float32)

        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)

        if norm1 < 1e-6 or norm2 < 1e-6:
            return 0.0

        dot_product = float(np.dot(v1, v2) / (norm1 * norm2))
        return max(0.0, min(1.0, dot_product))

    def identify_face(self, target_embedding: np.ndarray, enrolled_students: list) -> dict:
        """
        Compares target face embedding against a list of enrolled student records.
        Each student dict in enrolled_students should have: {'student_id', 'name', 'embedding'}
        """
        if not enrolled_students or target_embedding is None:
            return {
                'student_id': None,
                'name': 'UNKNOWN',
                'confidence': 0.0,
                'is_known': False,
                'status': 'UNKNOWN'
            }

        best_match = None
        best_similarity = -1.0

        for student in enrolled_students:
            enrolled_emb = student.get('embedding')
            if not enrolled_emb:
                continue

            similarity = self.calculate_similarity(target_embedding, enrolled_emb)
            if similarity > best_similarity:
                best_similarity = similarity
                best_match = student

        if best_match and best_similarity >= self.similarity_threshold:
            return {
                'student_id': best_match['student_id'],
                'name': best_match['name'],
                'confidence': round(best_similarity * 100, 1),
                'similarity_score': best_similarity,
                'is_known': True,
                'status': 'RECOGNIZED'
            }
        elif best_match and best_similarity >= self.uncertain_threshold:
            return {
                'student_id': best_match['student_id'],
                'name': f"Uncertain ({best_match['name']})",
                'confidence': round(best_similarity * 100, 1),
                'similarity_score': best_similarity,
                'is_known': False,
                'status': 'UNCERTAIN'
            }
        else:
            return {
                'student_id': None,
                'name': 'UNKNOWN',
                'confidence': round(max(0.0, best_similarity) * 100, 1) if best_similarity > 0 else 0.0,
                'similarity_score': max(0.0, best_similarity),
                'is_known': False,
                'status': 'UNKNOWN'
            }
