import { FaceDetector, FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

export const INTEGRITY_THRESHOLDS = {
  sampleIntervalMs: 1000,
  persistenceSamples: 3,
  phonePersistenceSamples: 3,
  blurVarianceMinimum: 18,
  blackFrameBrightnessMaximum: 12,
  poseAwayRatioMaximum: 0.42,
};

const MODEL_ROOT = "https://storage.googleapis.com/mediapipe-models";

export async function createIntegrityMonitor(video, onViolation, thresholds = INTEGRITY_THRESHOLDS) {
  const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm");
  const [faceDetector, faceLandmarker, phoneModel] = await Promise.all([
    FaceDetector.createFromOptions(vision, { baseOptions: { modelAssetPath: `${MODEL_ROOT}/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite` }, runningMode: "VIDEO" }),
    FaceLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: `${MODEL_ROOT}/face_landmarker/face_landmarker/float16/1/face_landmarker.task` }, runningMode: "VIDEO", numFaces: 2 }),
    cocoSsd.load(),
  ]);
  const canvas = document.createElement("canvas");
  const counters = new Map();
  let timer;
  let stopped = false;
  const flag = (type, reason, details, required = thresholds.persistenceSamples) => {
    const count = (counters.get(type) || 0) + 1;
    counters.set(type, count);
    if (count === required) onViolation({ type, reason, severity: "high", details: { samples: count, ...details } });
  };
  const clear = (type) => counters.delete(type);
  const frameQuality = () => {
    canvas.width = 160; canvas.height = 90;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let brightness = 0; let laplacian = 0;
    for (let i = 0; i < pixels.length; i += 4) brightness += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    // Downsampled Laplacian variance: low detail plus dark frames signals unusable video.
    for (let y = 1; y < 89; y += 2) for (let x = 1; x < 159; x += 2) { const i = (y * 160 + x) * 4; const v = pixels[i]; laplacian += Math.abs(4 * v - pixels[i - 8] - pixels[i + 8] - pixels[i - 640] - pixels[i + 640]); }
    return { brightness: brightness / (pixels.length / 4), sharpness: laplacian / 3500 };
  };
  const sample = async () => {
    if (stopped || video.readyState < 2) return;
    const now = performance.now();
    const faces = faceDetector.detectForVideo(video, now).detections;
    if (faces.length === 0) flag("NO_FACE", "Face not detected", {}); else clear("NO_FACE");
    if (faces.length > 1) flag("MULTIPLE_FACES", "Multiple faces detected", { faces: faces.length }); else clear("MULTIPLE_FACES");
    const landmarks = faceLandmarker.detectForVideo(video, now).faceLandmarks?.[0];
    if (landmarks) {
      const nose = landmarks[1]; const leftEye = landmarks[33]; const rightEye = landmarks[263];
      const eyeWidth = Math.abs(rightEye.x - leftEye.x);
      const away = Math.abs(nose.x - (leftEye.x + rightEye.x) / 2) / Math.max(eyeWidth, 0.01) > thresholds.poseAwayRatioMaximum;
      if (away) flag("LOOKING_AWAY", "Candidate looking away/down for too long", { ratio: Math.round(away * 100) / 100 }); else clear("LOOKING_AWAY");
    }
    const objects = await phoneModel.detect(video);
    if (objects.some((item) => item.class === "cell phone" && item.score >= 0.55)) flag("PHONE_DETECTED", "Mobile phone detected", {}, thresholds.phonePersistenceSamples); else clear("PHONE_DETECTED");
    const quality = frameQuality();
    if (quality.brightness < thresholds.blackFrameBrightnessMaximum || quality.sharpness < thresholds.blurVarianceMinimum) flag("CAMERA_QUALITY", "Camera visibility problem", quality); else clear("CAMERA_QUALITY");
  };
  timer = window.setInterval(() => { sample().catch((error) => console.warn("Integrity sample failed", error)); }, thresholds.sampleIntervalMs);
  return () => { stopped = true; window.clearInterval(timer); faceDetector.close(); faceLandmarker.close(); };
}
