let faceapiInstance = null;
let modelsLoaded = false;
let modelLoadingPromise = null;

export async function getFaceApi() {
  if (typeof window === 'undefined') {
    throw new Error('FaceAPI is only supported in browser runtime');
  }
  if (!faceapiInstance) {
    try {
      faceapiInstance = await import('@vladmandic/face-api');
    } catch (err) {
      console.warn('First attempt to load @vladmandic/face-api failed, retrying module load...', err);
      faceapiInstance = await import('@vladmandic/face-api');
    }

    try {
      const tf = faceapiInstance.tf;
      if (tf && tf.setBackend) {
        await tf.setBackend('webgl');
      }
      if (tf && tf.ready) {
        await tf.ready();
      }
    } catch {
      console.warn('WebGL initialization failed, falling back to default backend');
    }
  }
  return faceapiInstance;
}

export async function loadFaceApiModels(modelUri = '/models') {
  if (modelsLoaded) return true;
  if (modelLoadingPromise) return modelLoadingPromise;

  modelLoadingPromise = (async () => {
    try {
      const faceapi = await getFaceApi();
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(modelUri),
        faceapi.nets.tinyFaceDetector.loadFromUri(modelUri),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelUri),
        faceapi.nets.faceRecognitionNet.loadFromUri(modelUri),
      ]);
      modelsLoaded = true;
      return true;
    } catch (err) {
      console.warn('Primary model loading failed, trying secondary path...', err);
      try {
        const faceapi = await getFaceApi();
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        modelsLoaded = true;
        return true;
      } catch (err2) {
        console.error('All model loading attempts failed:', err2);
        throw err2;
      }
    } finally {
      modelLoadingPromise = null;
    }
  })();

  return modelLoadingPromise;
}

export function euclideanDistance(v1, v2) {
  if (!v1 || !v2 || v1.length !== v2.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < v1.length; i++) {
    const diff = v1[i] - v2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function calculateCalibratedConfidence(distance) {
  if (distance > 0.48) {
    return Math.max(0, Math.min(0.79, 1 - distance / 0.60));
  }
  const ratio = Math.max(0, Math.min(1, (0.48 - distance) / 0.48));
  return Number((0.80 + ratio * 0.19).toFixed(4));
}

function calculateIoU(box1, box2) {
  const xA = Math.max(box1.x, box2.x);
  const yA = Math.max(box1.y, box2.y);
  const xB = Math.min(box1.x + box1.width, box2.x + box2.width);
  const yB = Math.min(box1.y + box1.height, box2.y + box2.height);

  const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
  const box1Area = box1.width * box1.height;
  const box2Area = box2.width * box2.height;

  return interArea / (box1Area + box2Area - interArea + 1e-6);
}

export function applyNMS(detections, iouThreshold = 0.35) {
  if (!detections || detections.length <= 1) return detections;
  const sorted = [...detections].sort((a, b) => (b.detection?.score || 0) - (a.detection?.score || 0));
  const selected = [];

  for (const candidate of sorted) {
    const boxCandidate = candidate.detection?.box || candidate.box;
    if (!boxCandidate) continue;

    let keep = true;
    for (const approved of selected) {
      const boxApproved = approved.detection?.box || approved.box;
      if (boxApproved && calculateIoU(boxCandidate, boxApproved) > iouThreshold) {
        keep = false;
        break;
      }
    }

    if (keep) {
      selected.push(candidate);
    }
  }

  return selected;
}

export async function extractSingleDescriptor(input) {
  const faceapi = await getFaceApi();
  await loadFaceApiModels();

  const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
  const detection = await faceapi
    .detectSingleFace(input, options)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    return { descriptor: null, detection: null };
  }

  return {
    descriptor: Array.from(detection.descriptor),
    detection: detection.detection,
  };
}

export function createFaceMatcher(students, distanceThreshold = 0.48) {
  const labeledDescriptors = students
    .filter((s) => s.descriptor && s.descriptor.length === 128)
    .map((s) => {
      const Float32 = new Float32Array(s.descriptor);
      return {
        label: s.id,
        descriptors: [Float32],
      };
    });

  if (labeledDescriptors.length === 0) return null;

  return {
    findBestMatch: (queryDescriptor) => {
      let bestStudent = null;
      let minDistance = Infinity;

      for (const st of students) {
        if (st.descriptor && st.descriptor.length === 128) {
          const dist = euclideanDistance(queryDescriptor, st.descriptor);
          if (dist < minDistance) {
            minDistance = dist;
            bestStudent = st;
          }
        }
      }

      if (minDistance <= distanceThreshold && bestStudent) {
        return {
          label: bestStudent.id,
          distance: minDistance,
          student: bestStudent,
          confidence: calculateCalibratedConfidence(minDistance),
        };
      }

      return {
        label: 'unknown',
        distance: minDistance,
        student: null,
        confidence: Math.max(0, 1 - minDistance / 0.60),
      };
    },
  };
}
