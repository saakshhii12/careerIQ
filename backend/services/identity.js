/**
 * Compact face-descriptor comparison for interview identity checks.
 * Descriptors are normalized landmark-derived vectors from MediaPipe Face Landmarker
 * (client-extracted). We never store continuous video.
 */

const MATCH_THRESHOLD = Number(process.env.IDENTITY_MATCH_THRESHOLD || 0.88);
const LIVENESS_MIN_DELTA = Number(process.env.IDENTITY_LIVENESS_MIN_DELTA || 0.035);

export function getIdentityThresholds() {
  return { matchThreshold: MATCH_THRESHOLD, livenessMinDelta: LIVENESS_MIN_DELTA };
}

export function isValidDescriptor(descriptor) {
  return (
    Array.isArray(descriptor) &&
    descriptor.length >= 32 &&
    descriptor.length <= 256 &&
    descriptor.every((value) => typeof value === "number" && Number.isFinite(value))
  );
}

export function cosineSimilarity(a, b) {
  if (!isValidDescriptor(a) || !isValidDescriptor(b) || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na <= 0 || nb <= 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function descriptorDelta(a, b) {
  return 1 - cosineSimilarity(a, b);
}

/**
 * Evaluate an identity verification payload from the client.
 * Server decides pass/fail — client claims alone are never enough.
 */
export function evaluateIdentityCheck({
  faceCount,
  liveDescriptor,
  challengeDescriptor,
  referenceDescriptor,
  claimLivenessPassed,
}) {
  const reasons = [];

  if (!Number.isInteger(faceCount) || faceCount !== 1) {
    reasons.push(faceCount === 0 ? "No face detected." : "Exactly one face is required.");
  }

  if (!isValidDescriptor(liveDescriptor)) {
    reasons.push("Live face descriptor is invalid.");
  }

  let livenessPassed = false;
  if (isValidDescriptor(challengeDescriptor) && isValidDescriptor(liveDescriptor)) {
    const delta = descriptorDelta(challengeDescriptor, liveDescriptor);
    livenessPassed = delta >= LIVENESS_MIN_DELTA;
    if (!livenessPassed) {
      reasons.push("Liveness check failed. Please follow the on-screen movement challenge.");
    }
  } else if (claimLivenessPassed) {
    // Client claimed liveness but did not send comparable descriptors.
    reasons.push("Liveness evidence is incomplete.");
  } else {
    reasons.push("Liveness check is required.");
  }

  let matchScore = null;
  let identityMatched = true;
  if (isValidDescriptor(referenceDescriptor) && isValidDescriptor(liveDescriptor)) {
    matchScore = cosineSimilarity(referenceDescriptor, liveDescriptor);
    identityMatched = matchScore >= MATCH_THRESHOLD;
    if (!identityMatched) {
      reasons.push("Live face does not match the enrolled candidate identity.");
    }
  }

  const passed =
    reasons.length === 0 && faceCount === 1 && livenessPassed && identityMatched;

  return {
    passed,
    livenessPassed,
    matchScore: matchScore == null ? null : Number(matchScore.toFixed(4)),
    reasons,
    enrolledReferenceUsed: isValidDescriptor(referenceDescriptor),
    thresholds: getIdentityThresholds(),
  };
}

export function evaluateContinuousMatch(liveDescriptor, baselineDescriptor) {
  if (!isValidDescriptor(liveDescriptor) || !isValidDescriptor(baselineDescriptor)) {
    return { matched: false, matchScore: null, reason: "Identity baseline unavailable." };
  }
  const matchScore = cosineSimilarity(baselineDescriptor, liveDescriptor);
  return {
    matched: matchScore >= MATCH_THRESHOLD,
    matchScore: Number(matchScore.toFixed(4)),
    reason:
      matchScore >= MATCH_THRESHOLD
        ? null
        : "Possible identity mismatch with the enrolled candidate.",
  };
}
