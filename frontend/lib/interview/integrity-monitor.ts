import { FaceDetector, FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

/**
 * Client-side camera integrity using pretrained browser models.
 * Samples ~2×/sec. Finger-over-lens / blank / blur use image metrics (not face alone).
 */

export const INTEGRITY_THRESHOLDS = {
  sampleIntervalMs: 500,
  /** Faster confirm for camera covered / blank. */
  obstructionPersistenceSamples: 2,
  persistenceSamples: 3,
  phonePersistenceSamples: 3,
  phoneConfidence: 0.55,
  /** Finger-covered frames are often dark but not pure black. */
  blackFrameBrightnessMaximum: 42,
  /** Uniform skin/finger obstruction: low pixel variance. */
  obstructionVarianceMaximum: 380,
  blurVarianceMinimum: 22,
  poseAwayRatioMaximum: 0.48,
  lookingDownRatioMinimum: 0.55,
};

const MODEL_ROOT = "https://storage.googleapis.com/mediapipe-models";

export interface IntegrityViolation {
  type: string;
  reason: string;
  severity: string;
  details?: Record<string, unknown>;
}

export interface IntegrityMonitorHandle {
  dispose: () => void;
  getStatus: () => "starting" | "active" | "error";
  getLastMetrics: () => { brightness: number; variance: number; sharpness: number } | null;
}

function waitForVideo(video: HTMLVideoElement, timeoutMs = 12_000): Promise<HTMLVideoElement> {
  if (video.readyState >= 2 && video.videoWidth > 0) return Promise.resolve(video);
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        resolve(video);
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error("Camera video stream did not become ready."));
        return;
      }
      window.setTimeout(tick, 120);
    };
    tick();
  });
}

export async function createIntegrityMonitor(
  video: HTMLVideoElement,
  onViolation: (event: IntegrityViolation) => void,
  thresholds = INTEGRITY_THRESHOLDS,
  onStatus?: (status: "starting" | "active" | "error", detail?: string) => void
): Promise<IntegrityMonitorHandle> {
  onStatus?.("starting");
  await waitForVideo(video);

  let faceDetector: FaceDetector | null = null;
  let faceLandmarker: FaceLandmarker | null = null;
  let phoneModel: Awaited<ReturnType<typeof cocoSsd.load>> | null = null;
  let modelsReady = false;

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
    modelsReady = true;
  } catch (error) {
    console.warn("Vision models failed to load; continuing with image-quality checks only.", error);
  }

  const canvas = document.createElement("canvas");
  const counters = new Map<string, number>();
  let timer: ReturnType<typeof setInterval> | undefined;
  let stopped = false;
  const reported = new Set<string>();
  let status: "starting" | "active" | "error" = modelsReady ? "active" : "active";
  let lastMetrics: { brightness: number; variance: number; sharpness: number } | null = null;
  onStatus?.(status, modelsReady ? "Camera integrity monitoring active" : "Quality-only monitoring active");

  const flag = (
    type: string,
    reason: string,
    details: Record<string, unknown>,
    required = thresholds.persistenceSamples
  ) => {
    const count = (counters.get(type) || 0) + 1;
    counters.set(type, count);
    if (count >= required && !reported.has(type)) {
      reported.add(type);
      onViolation({ type, reason, severity: "critical", details: { samples: count, ...details } });
    }
  };

  const clear = (type: string) => {
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
    const grays: number[] = [];
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
        laplacian += Math.abs(
          4 * v - pixels[i - 8] - pixels[i + 8] - pixels[i - 640] - pixels[i + 640]
        );
      }
    }
    const metrics = {
      brightness,
      variance,
      sharpness: laplacian / 3500,
    };
    lastMetrics = metrics;
    return metrics;
  };

  const sample = async () => {
    if (stopped) return;
    if (video.readyState < 2 || video.videoWidth === 0) {
      flag(
        "CAMERA_UNAVAILABLE",
        "Camera feed is unavailable. Please enable and position your camera correctly.",
        {},
        thresholds.obstructionPersistenceSamples
      );
      return;
    }
    clear("CAMERA_UNAVAILABLE");

    const quality = frameQuality();
    const covered =
      quality.brightness < thresholds.blackFrameBrightnessMaximum ||
      (quality.variance < thresholds.obstructionVarianceMaximum &&
        quality.brightness < 90);

    if (covered) {
      flag(
        "CAMERA_OBSTRUCTED",
        "Camera feed is unavailable. Please enable and position your camera correctly.",
        quality,
        thresholds.obstructionPersistenceSamples
      );
    } else {
      clear("CAMERA_OBSTRUCTED");
    }

    if (!covered && quality.sharpness < thresholds.blurVarianceMinimum) {
      flag(
        "CAMERA_QUALITY",
        "Camera visibility is insufficient. Please ensure your face and surroundings are clearly visible.",
        quality,
        thresholds.obstructionPersistenceSamples
      );
    } else if (!covered) {
      clear("CAMERA_QUALITY");
    }

    // Image-quality checks above always run. Face/phone need models.
    if (!faceDetector || !faceLandmarker || !phoneModel) return;

    const now = performance.now();
    let faces: { length: number } = { length: 0 };
    try {
      faces = faceDetector.detectForVideo(video, now).detections;
    } catch {
      return;
    }

    if (faces.length === 0 && !covered) {
      flag("NO_FACE", "Face not detected in the camera frame.", {});
    } else clear("NO_FACE");

    if (faces.length > 1) {
      flag("MULTIPLE_FACES", "Multiple people were detected in the camera frame.", {
        faces: faces.length,
      });
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
        const lookingAway =
          lateral > thresholds.poseAwayRatioMaximum ||
          downward > thresholds.lookingDownRatioMinimum;
        if (lookingAway) {
          flag("LOOKING_AWAY", "Candidate looking away or down for too long.", {
            lateral: Number(lateral.toFixed(3)),
            downward: Number(downward.toFixed(3)),
          });
        } else clear("LOOKING_AWAY");
      }
    } catch {
      // ignore landmark errors for a frame
    }

    try {
      const objects = await phoneModel.detect(video);
      if (
        objects.some(
          (item) => item.class === "cell phone" && item.score >= thresholds.phoneConfidence
        )
      ) {
        flag(
          "PHONE_DETECTED",
          "A mobile device was detected in the camera frame.",
          {},
          thresholds.phonePersistenceSamples
        );
      } else clear("PHONE_DETECTED");
    } catch {
      // ignore phone model errors for a frame
    }
  };

  timer = window.setInterval(() => {
    sample().catch((error) => console.warn("Integrity sample failed", error));
  }, thresholds.sampleIntervalMs) as unknown as ReturnType<typeof setInterval>;

  // Immediate first sample so finger-cover is noticed quickly.
  void sample();

  return {
    dispose() {
      stopped = true;
      window.clearInterval(timer);
      faceDetector?.close();
      faceLandmarker?.close();
    },
    getStatus() {
      return status;
    },
    getLastMetrics() {
      return lastMetrics;
    },
  };
}
