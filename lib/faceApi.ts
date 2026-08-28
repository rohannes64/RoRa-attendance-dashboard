// Face API Computer Vision Engine for DrishtiAttendance AI
// Highly optimized for 60 FPS real-time execution with WebGL acceleration

import type { StudentProfile, DetectionResult } from '../types/attendance';

// Cache loaded faceapi instance
let faceapiInstance: typeof import('@vladmandic/face-api') | null = null;
let modelsLoaded = false;
let modelLoadingPromise: Promise<boolean> | null = null;

export async function getFaceApi(): Promise<typeof import('@vladmandic/face-api')> {
  if (typeof window === 'undefined') {
    throw new Error('FaceAPI is only supported in browser runtime');
  }
  if (!faceapiInstance) {
    faceapiInstance = await import('@vladmandic/face-api');
    try {
      const tf = faceapiInstance.tf as unknown as { setBackend?: (b: string) => Promise<boolean>; ready?: () => Promise<void> };
      if (tf?.setBackend) {
        await tf.setBackend('webgl');
      }
      if (tf?.ready) {
        await tf.ready();
      }
    } catch {
      console.warn('WebGL initialization failed, falling back to default backend');
    }
  }
  return faceapiInstance;
}

export async function loadFaceApiModels(
  modelsPath: string = '/models',
  onProgress?: (msg: string, percent: number) => void
): Promise<boolean> {
  if (modelsLoaded) return true;
  if (modelLoadingPromise) return modelLoadingPromise;

  modelLoadingPromise = (async () => {
    try {
      const faceapi = await getFaceApi();
      onProgress?.('Loading Real-Time TinyFace Detector...', 30);
      await faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath);

      onProgress?.('Loading 68-Point Landmark Mesh...', 60);
      await Promise.all([
        faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelsPath).catch(() => {}),
      ]);

      onProgress?.('Loading 128D FaceNet Recognition...', 85);
      await faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath);

      // Load SSD MobileNet in background if available
      faceapi.nets.ssdMobilenetv1.loadFromUri(modelsPath).catch(() => {});

      modelsLoaded = true;
      onProgress?.('Neural Models Ready', 100);
      return true;
    } catch (err) {
      console.error('Failed to load FaceAPI models from URI:', err);
      modelsLoaded = false;
      modelLoadingPromise = null;
      throw err;
    }
  })();

  return modelLoadingPromise;
}

export function areModelsLoaded(): boolean {
  return modelsLoaded;
}

/**
 * Creates an optimized downscaled canvas copy of large inputs (e.g. 4K camera or huge photos)
 */
function getScaledMediaCanvas(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  maxDimension: number = 640
): { element: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement; scale: number } {
  let width = 0;
  let height = 0;

  if (input instanceof HTMLVideoElement) {
    width = input.videoWidth || 640;
    height = input.videoHeight || 480;
  } else if (input instanceof HTMLImageElement) {
    width = input.naturalWidth || input.width;
    height = input.naturalHeight || input.height;
  } else {
    width = input.width;
    height = input.height;
  }

  if (width === 0 || height === 0) {
    return { element: input, scale: 1 };
  }

  if (width <= maxDimension && height <= maxDimension) {
    return { element: input, scale: 1 };
  }

  const scale = maxDimension / Math.max(width, height);
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(input, 0, 0, targetW, targetH);
  }

  return { element: canvas, scale };
}

/**
 * Calculates Euclidean distance between two 128-dimensional embedding vectors
 */
export function calculateEuclideanDistance(descriptor1: number[] | Float32Array, descriptor2: number[] | Float32Array): number {
  if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) return 1.0;
  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Calculates Cosine Similarity between two 128-dimensional embedding vectors (1.0 = identical)
 */
export function calculateCosineSimilarity(descriptor1: number[] | Float32Array, descriptor2: number[] | Float32Array): number {
  if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) return 0;
  let dot = 0;
  let mag1 = 0;
  let mag2 = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    dot += descriptor1[i] * descriptor2[i];
    mag1 += descriptor1[i] * descriptor1[i];
    mag2 += descriptor2[i] * descriptor2[i];
  }
  if (mag1 === 0 || mag2 === 0) return 0;
  return dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

/**
 * Matches extracted face descriptor against enrolled student database
 */
export function matchStudentDescriptor(
  descriptor: Float32Array | number[],
  students: StudentProfile[],
  distanceThreshold: number = 0.52
): {
  matchedStudent: StudentProfile | null;
  distance: number;
  confidence: number;
  allMatches: { student: StudentProfile; distance: number; confidence: number }[];
} {
  if (!students || students.length === 0 || !descriptor) {
    return { matchedStudent: null, distance: 1.0, confidence: 0, allMatches: [] };
  }

  const matches = students.map((student) => {
    const dist = calculateEuclideanDistance(descriptor, student.descriptor);
    // Convert Euclidean distance (< 0.6 standard match threshold) to a calibrated 0-100% confidence
    const confidence = Math.max(0, Math.min(99.4, Math.round((1 - dist / 0.62) * 100)));
    return {
      student,
      distance: Number(dist.toFixed(4)),
      confidence,
    };
  });

  matches.sort((a, b) => a.distance - b.distance);

  const bestMatch = matches[0];
  const isMatch = bestMatch && bestMatch.distance <= distanceThreshold;

  return {
    matchedStudent: isMatch ? bestMatch.student : null,
    distance: bestMatch ? bestMatch.distance : 1.0,
    confidence: bestMatch ? bestMatch.confidence : 0,
    allMatches: matches.slice(0, 5),
  };
}

/**
 * Detects all faces in a video, image, or canvas element (Ultra-low latency)
 */
export async function detectFacesInMedia(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  options: {
    useTiny?: boolean;
    scoreThreshold?: number;
  } = {}
) {
  const faceapi = await getFaceApi();
  if (!modelsLoaded) {
    await loadFaceApiModels();
  }

  // Optimize input size: 320 for high precision & speed
  const detectorOptions = options.useTiny !== false
    ? new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: options.scoreThreshold ?? 0.45,
      })
    : new faceapi.SsdMobilenetv1Options({
        minConfidence: options.scoreThreshold ?? 0.45,
        maxResults: 6,
      });

  try {
    const detections = await faceapi
      .detectAllFaces(input, detectorOptions)
      .withFaceLandmarks(faceapi.nets.faceLandmark68TinyNet.isLoaded)
      .withFaceDescriptors();

    return detections;
  } catch {
    try {
      const detections = await faceapi
        .detectAllFaces(input, detectorOptions)
        .withFaceLandmarks(false)
        .withFaceDescriptors();

      return detections;
    } catch {
      return [];
    }
  }
}

/**
 * Extracts a 128D descriptor from a single face (for enrollment or testing)
 */
export async function extractSingleDescriptor(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<{ descriptor: number[] | null; box: { x: number; y: number; width: number; height: number } | null }> {
  const faceapi = await getFaceApi();
  if (!modelsLoaded) {
    await loadFaceApiModels();
  }

  // Pre-scale large inputs to prevent browser freeze
  const { element: scaledInput, scale } = getScaledMediaCanvas(input, 640);

  try {
    const tinyDetection = await faceapi
      .detectSingleFace(scaledInput, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.35 }))
      .withFaceLandmarks(faceapi.nets.faceLandmark68TinyNet.isLoaded)
      .withFaceDescriptor();

    if (tinyDetection) {
      const invScale = 1 / scale;
      return {
        descriptor: Array.from(tinyDetection.descriptor),
        box: {
          x: Math.round(tinyDetection.detection.box.x * invScale),
          y: Math.round(tinyDetection.detection.box.y * invScale),
          width: Math.round(tinyDetection.detection.box.width * invScale),
          height: Math.round(tinyDetection.detection.box.height * invScale),
        },
      };
    }
  } catch {}

  // Fallback to standard landmark net
  try {
    const detection = await faceapi
      .detectSingleFace(scaledInput, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.35 }))
      .withFaceLandmarks(false)
      .withFaceDescriptor();

    if (detection) {
      const invScale = 1 / scale;
      return {
        descriptor: Array.from(detection.descriptor),
        box: {
          x: Math.round(detection.detection.box.x * invScale),
          y: Math.round(detection.detection.box.y * invScale),
          width: Math.round(detection.detection.box.width * invScale),
          height: Math.round(detection.detection.box.height * invScale),
        },
      };
    }
  } catch {}

  return { descriptor: null, box: null };
}

/**
 * Draws clean, high-precision computer vision overlay onto the canvas
 */
export function drawAdvancedHUD(
  canvas: HTMLCanvasElement,
  detections: DetectionResult[],
  showLandmarks: boolean = true
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  detections.forEach((det) => {
    const { x, y, width, height } = det.box;
    const isMatched = !!det.matchedStudent;
    const student = det.matchedStudent;

    const strokeColor = isMatched ? '#10b981' : '#e2e8f0';
    const tagBg = '#0b0f19';

    ctx.save();

    // 1. Clean Bounding Box (1.5px solid)
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = strokeColor;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 4);
    ctx.stroke();

    // 2. Subtle 68 Landmarks
    if (showLandmarks && det.landmarks && det.landmarks.length > 0) {
      ctx.fillStyle = isMatched ? 'rgba(16, 185, 129, 0.6)' : 'rgba(226, 232, 240, 0.45)';
      det.landmarks.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.2, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // 3. Compact Label Card at Top
    const nameText = student ? student.name : 'Scanning face...';
    const metaText = student ? `${student.rollNo}  ·  ${det.confidence}%` : `Dist: ${det.distance.toFixed(2)}`;

    ctx.font = '600 12px "Inter", -apple-system, sans-serif';
    const nameWidth = ctx.measureText(nameText).width;
    ctx.font = '500 10.5px "JetBrains Mono", monospace';
    const metaWidth = ctx.measureText(metaText).width;
    const cardWidth = Math.max(nameWidth, metaWidth) + 24;
    const cardHeight = 36;
    const cardY = Math.max(6, y - cardHeight - 6);
    const cardX = x;

    // Card background
    ctx.fillStyle = tagBg;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 4);
    ctx.fill();

    // Card border
    ctx.lineWidth = 1;
    ctx.strokeStyle = isMatched ? '#1e382b' : '#222f4b';
    ctx.stroke();

    // Verification indicator dot
    ctx.fillStyle = strokeColor;
    ctx.beginPath();
    ctx.arc(cardX + 10, cardY + 13, 3, 0, 2 * Math.PI);
    ctx.fill();

    // Student Name
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 12px "Inter", -apple-system, sans-serif';
    ctx.fillText(nameText, cardX + 18, cardY + 16);

    // Metadata
    ctx.fillStyle = isMatched ? '#34d399' : '#94a3b8';
    ctx.font = '500 10.5px "JetBrains Mono", monospace';
    ctx.fillText(metaText, cardX + 10, cardY + 30);

    ctx.restore();
  });
}
