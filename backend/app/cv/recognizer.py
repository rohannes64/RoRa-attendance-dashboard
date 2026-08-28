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
        Single face identity comparison fallback.
        """
        res = self.identify_multiple_faces([target_embedding], enrolled_students)
        return res[0] if res else {
            'student_id': None,
            'name': 'UNKNOWN',
            'confidence': 0.0,
            'is_known': False,
            'status': 'UNKNOWN'
        }

    def identify_multiple_faces(self, target_embeddings: list, enrolled_students: list) -> list:
        """
        Global Bipartite / Greedy Match for multiple faces in a single frame.
        Guarantees ONE-TO-ONE matching: a single enrolled student can NEVER be 
        assigned to more than one face in the same video frame.
        """
        num_faces = len(target_embeddings)
        num_students = len(enrolled_students)

        results = [
            {
                'student_id': None,
                'name': 'UNKNOWN',
                'confidence': 0.0,
                'similarity_score': 0.0,
                'is_known': False,
                'status': 'UNKNOWN'
            }
            for _ in range(num_faces)
        ]

        if num_faces == 0 or num_students == 0:
            return results

        # Build similarity pair list: (similarity, face_idx, student_idx)
        pairs = []
        for f_idx, emb in enumerate(target_embeddings):
            if emb is None:
                continue
            for s_idx, student in enumerate(enrolled_students):
                enrolled_emb = student.get('embedding')
                if not enrolled_emb:
                    continue
                sim = self.calculate_similarity(emb, enrolled_emb)
                pairs.append((sim, f_idx, s_idx))

        # Sort pairs by similarity descending
        pairs.sort(key=lambda x: x[0], reverse=True)

        assigned_faces = set()
        assigned_students = set()

        for sim, f_idx, s_idx in pairs:
            if f_idx in assigned_faces or s_idx in assigned_students:
                continue

            student = enrolled_students[s_idx]

            if sim >= self.similarity_threshold:
                results[f_idx] = {
                    'student_id': student['student_id'],
                    'name': student['name'],
                    'confidence': round(sim * 100, 1),
                    'similarity_score': sim,
                    'is_known': True,
                    'status': 'RECOGNIZED'
                }
                assigned_faces.add(f_idx)
                assigned_students.add(s_idx)
            elif sim >= self.uncertain_threshold:
                # Mark as uncertain but don't lock identity exclusively unless high confidence
                results[f_idx] = {
                    'student_id': None,
                    'name': 'UNKNOWN',
                    'confidence': round(sim * 100, 1),
                    'similarity_score': sim,
                    'is_known': False,
                    'status': 'UNCERTAIN'
                }
                assigned_faces.add(f_idx)

        return results
