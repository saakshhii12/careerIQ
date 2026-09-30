import { FaceDetector, FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const MODEL_ROOT = "https://storage.googleapis.com/mediapipe-models";

/** Landmark indices used to build a compact normalized face descriptor. */
const DESCRIPTOR_INDEXES = [
  1, 4, 6, 10, 33, 61, 70, 105, 107, 133, 136, 152, 168, 172, 199, 263, 290, 300, 334, 336, 362, 397,
];

let visionPromise: Promise<Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>> | null = null;
let detectorPromise: Promise<FaceDetector> | null = null;
let landmarkerPromise: Promise<FaceLandmarker> | null = null;

async function getVision() {
  if (!visionPromise) {
    visionPromise = FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
    );
  }
  return visionPromise;
}

async function getFaceDetector() {
  if (!detectorPromise) {
    detectorPromise = getVision().then((vision) =>
      FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `${MODEL_ROOT}/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
        },
        runningMode: "IMAGE",
      })
    );
  }
  return detectorPromise;
}

async function getFaceLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = getVision().then((vision) =>
      FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `${MODEL_ROOT}/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        },
        runningMode: "IMAGE",
        numFaces: 2,
      })
    );
  }
  return landmarkerPromise;
}

function buildDescriptor(landmarks: Array<{ x: number; y: number; z?: number }>): number[] {
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const midX = (leftEye.x + rightEye.x) / 2;
  const midY = (leftEye.y + rightEye.y) / 2;
  const scale = Math.max(Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y), 0.01);

  const values: number[] = [];
  for (const index of DESCRIPTOR_INDEXES) {
    const point = landmarks[index];
    values.push((point.x - midX) / scale, (point.y - midY) / scale, (point.z ?? 0) / scale);
  }
  return values;
}

export interface FaceSample {
  faceCount: number;
  descriptor: number[] | null;
}

export async function sampleFaceFromVideo(video: HTMLVideoElement): Promise<FaceSample> {
  if (video.readyState < 2 || video.videoWidth === 0) {
    return { faceCount: 0, descriptor: null };
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { faceCount: 0, descriptor: null };
  ctx.drawImage(video, 0, 0);

  const [detector, landmarker] = await Promise.all([getFaceDetector(), getFaceLandmarker()]);
  const faces = detector.detect(canvas).detections;
  if (faces.length !== 1) {
    return { faceCount: faces.length, descriptor: null };
  }

  const landmarks = landmarker.detect(canvas).faceLandmarks?.[0];
  if (!landmarks?.length) {
    return { faceCount: 1, descriptor: null };
  }

  return { faceCount: 1, descriptor: buildDescriptor(landmarks) };
}

export async function sampleFaceFromImageElement(
  image: HTMLImageElement | HTMLCanvasElement
): Promise<FaceSample> {
  const [detector, landmarker] = await Promise.all([getFaceDetector(), getFaceLandmarker()]);
  const faces = detector.detect(image).detections;
  if (faces.length !== 1) return { faceCount: faces.length, descriptor: null };
  const landmarks = landmarker.detect(image).faceLandmarks?.[0];
  if (!landmarks?.length) return { faceCount: 1, descriptor: null };
  return { faceCount: 1, descriptor: buildDescriptor(landmarks) };
}
