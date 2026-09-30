import { FaceDetector, FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

export const INTEGRITY_THRESHOLDS = {
  sampleIntervalMs: 500,
  obstructionPersistenceSamples: 2,
  persistenceSamples: 3,
  phonePersistenceSamples: 3,
  phoneConfidence: 0.55,
  blackFrameBrightnessMaximum: 42,
  obstructionVarianceMaximum: 380,
  blurVarianceMinimum: 22,
  poseAwayRatioMaximum: 0.48,
  lookingDownRatioMinimum: 0.55,
};

const MODEL_ROOT = "https://storage.googleapis.com/mediapipe-models";

function waitForVideo(video, timeoutMs = 12000) {
  if (video.readyState >= 2 && video.videoWidth > 0) return Promise.resolve(video);
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (video.readyState >= 2 && video.videoWidth > 0) return resolve(video);
      if (Date.now() - started > timeoutMs) return reject(new Error("Camera video stream did not become ready."));
      window.setTimeout(tick, 120);
    };
    tick();
  });
}

export async function createIntegrityMonitor(video, onViolation, thresholds = INTEGRITY_THRESHOLDS) {
  await waitForVideo(video);

  let faceDetector = null;
  let faceLandmarker = null;
  let phoneModel = null;
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
    );
    [faceDetector, faceLandmarker, phoneModel] = await Promise.all([
      FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `${MODEL_ROOT}/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
        },
        runningMode: "VIDEO",
      }),
      FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `${MODEL_ROOT}/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        },
        runningMode: "VIDEO",
        numFaces: 2,
      }),
      cocoSsd.load(),
    ]);
  } catch (error) {
    console.warn("Vision models failed; quality-only monitoring.", error);
  }

  const canvas = document.createElement("canvas");
  const counters = new Map();
  let timer;
  let stopped = false;
  const reported = new Set();

  const flag = (type, reason, details, required = thresholds.persistenceSamples) => {
    const count = (counters.get(type) || 0) + 1;
    counters.set(type, count);
    if (count >= required && !reported.has(type)) {
      reported.add(type);
      onViolation({ type, reason, severity: "high", details: { samples: count, ...details } });
    }
  };
  const clear = (type) => {
    counters.delete(type);
    reported.delete(type);
  };

  const frameQuality = () => {
    canvas.width = 160;
    canvas.height = 90;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return { brightness: 255, variance: 9999, sharpness: 999 };
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const grays = [];
    let brightness = 0;
    let laplacian = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const g = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      grays.push(g);
      brightness += g;
    }
    brightness /= grays.length;
    let variance = 0;
    for (const g of grays) variance += (g - brightness) ** 2;
    variance /= grays.length;
    for (let y = 1; y < 89; y += 2) {
      for (let x = 1; x < 159; x += 2) {
        const i = (y * 160 + x) * 4;
        const v = pixels[i];
        laplacian += Math.abs(4 * v - pixels[i - 8] - pixels[i + 8] - pixels[i - 640] - pixels[i + 640]);
      }
    }
    return { brightness, variance, sharpness: laplacian / 3500 };
  };

  const sample = async () => {
    if (stopped) return;
    if (video.readyState < 2 || video.videoWidth === 0) {
      flag("CAMERA_UNAVAILABLE", "Camera feed is unavailable.", {}, thresholds.obstructionPersistenceSamples);
      return;
    }
    clear("CAMERA_UNAVAILABLE");

    const quality = frameQuality();
    const covered =
      quality.brightness < thresholds.blackFrameBrightnessMaximum ||
      (quality.variance < thresholds.obstructionVarianceMaximum && quality.brightness < 90);

    if (covered) {
      flag(
        "CAMERA_OBSTRUCTED",
        "Camera feed is unavailable. Please enable and position your camera correctly.",
        quality,
        thresholds.obstructionPersistenceSamples
      );
    } else clear("CAMERA_OBSTRUCTED");

    if (!covered && quality.sharpness < thresholds.blurVarianceMinimum) {
      flag(
        "CAMERA_QUALITY",
        "Camera visibility is insufficient. Please ensure your face and surroundings are clearly visible.",
        quality,
        thresholds.obstructionPersistenceSamples
      );
    } else if (!covered) clear("CAMERA_QUALITY");

    if (!faceDetector || !faceLandmarker || !phoneModel) return;

    const now = performance.now();
    let faces = { length: 0 };
    try {
      faces = faceDetector.detectForVideo(video, now).detections;
    } catch {
      return;
    }
    if (faces.length === 0 && !covered) flag("NO_FACE", "Face not detected in the camera frame.", {});
    else clear("NO_FACE");
    if (faces.length > 1) {
      flag("MULTIPLE_FACES", "Multiple people were detected in the camera frame.", { faces: faces.length });
    } else clear("MULTIPLE_FACES");

    try {
      const landmarks = faceLandmarker.detectForVideo(video, now).faceLandmarks?.[0];
      if (landmarks) {
        const nose = landmarks[1];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        const eyeMidX = (leftEye.x + rightEye.x) / 2;
        const eyeMidY = (leftEye.y + rightEye.y) / 2;
        const eyeWidth = Math.max(Math.abs(rightEye.x - leftEye.x), 0.01);
        const lateral = Math.abs(nose.x - eyeMidX) / eyeWidth;
        const downward = (nose.y - eyeMidY) / eyeWidth;
        if (lateral > thresholds.poseAwayRatioMaximum || downward > thresholds.lookingDownRatioMinimum) {
          flag("LOOKING_AWAY", "Candidate looking away or down for too long.", {
            lateral: Number(lateral.toFixed(3)),
            downward: Number(downward.toFixed(3)),
          });
        } else clear("LOOKING_AWAY");
      }
    } catch {
      /* ignore */
    }

    try {
      const objects = await phoneModel.detect(video);
      if (objects.some((item) => item.class === "cell phone" && item.score >= thresholds.phoneConfidence)) {
        flag("PHONE_DETECTED", "A mobile device was detected in the camera frame.", {}, thresholds.phonePersistenceSamples);
      } else clear("PHONE_DETECTED");
    } catch {
      /* ignore */
    }
  };

  timer = window.setInterval(() => {
    sample().catch((error) => console.warn("Integrity sample failed", error));
  }, thresholds.sampleIntervalMs);
  void sample();

  return {
    dispose() {
      stopped = true;
      window.clearInterval(timer);
      faceDetector?.close();
      faceLandmarker?.close();
    },
  };
}
