"use client";

import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { sampleFaceFromVideo } from "@/lib/interview/face-identity";
import { submitIdentityCheck } from "@/lib/api/interview";

type Step = "camera" | "challenge" | "confirm" | "submitting" | "failed" | "passed";

interface IdentityVerificationGateProps {
  sessionId: number;
  hasEnrolledIdentity: boolean;
  onVerified: () => void;
  onPermissionActivity?: () => void;
  webcamRef: React.RefObject<Webcam | null>;
}

export function IdentityVerificationGate({
  sessionId,
  hasEnrolledIdentity,
  onVerified,
  onPermissionActivity,
  webcamRef,
}: IdentityVerificationGateProps) {
  const [step, setStep] = useState<Step>("camera");
  const [message, setMessage] = useState("Allow camera access to verify your identity.");
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const challengeDescriptorRef = useRef<number[] | null>(null);
  const liveDescriptorRef = useRef<number[] | null>(null);
  const faceCountRef = useRef(0);

  useEffect(() => {
    onPermissionActivity?.();
  }, [onPermissionActivity]);

  const captureSample = async () => {
    const video = webcamRef.current?.video;
    if (!video) throw new Error("Camera is not ready.");
    const sample = await sampleFaceFromVideo(video);
    faceCountRef.current = sample.faceCount;
    if (sample.faceCount !== 1 || !sample.descriptor) {
      throw new Error(
        sample.faceCount === 0
          ? "No face detected. Position your face clearly in the camera."
          : "Exactly one face must be visible."
      );
    }
    return sample.descriptor;
  };

  const startChallenge = async () => {
    setError(null);
    try {
      setMessage("Hold still while we detect your face…");
      await captureSample();
      setStep("challenge");
      setMessage("Liveness check: slowly turn your head left, then look straight at the camera.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Face detection failed.");
      setStep("failed");
    }
  };

  const captureChallengePose = async () => {
    setError(null);
    try {
      challengeDescriptorRef.current = await captureSample();
      setStep("confirm");
      setMessage("Now look straight at the camera and confirm your identity.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Liveness capture failed.");
      setStep("failed");
    }
  };

  const confirmIdentity = async () => {
    setError(null);
    setStep("submitting");
    setMessage("Verifying identity with the server…");
    try {
      liveDescriptorRef.current = await captureSample();
      const result = await submitIdentityCheck(sessionId, {
        faceCount: faceCountRef.current,
        liveDescriptor: liveDescriptorRef.current,
        challengeDescriptor: challengeDescriptorRef.current,
        claimLivenessPassed: true,
        enrollIfMissing: !hasEnrolledIdentity,
      });
      if (!result.passed) {
        setError(result.message || result.reasons?.[0] || "Identity verification failed.");
        setStep("failed");
        return;
      }
      setStep("passed");
      setMessage(result.message || "Identity verified.");
      onVerified();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Identity verification failed.");
      setStep("failed");
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 lg:p-6">
      <GlassCard className="!p-5">
        <h1 className="text-lg font-semibold text-[var(--color-text)]">Identity verification</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Confirm you are the authenticated candidate before the AI interview starts. Your profile
          resume is already loaded — no resume upload is required.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--color-text-muted)]">
          <li>Exactly one face must be visible</li>
          <li>Complete a short liveness movement</li>
          <li>
            {hasEnrolledIdentity
              ? "Your live face is matched to your enrolled identity"
              : "This check enrolls your face identity for this account"}
          </li>
        </ul>
      </GlassCard>

      <GlassCard className="space-y-3 !p-4">
        <div className="overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
          <Webcam
            ref={webcamRef}
            audio={false}
            mirrored
            videoConstraints={{ width: 640, height: 360, facingMode: "user" }}
            className="aspect-video w-full object-cover"
            onUserMedia={() => {
              onPermissionActivity?.();
              setCameraReady(true);
              setMessage("Camera connected. Start verification when ready.");
            }}
            onUserMediaError={() => {
              onPermissionActivity?.();
              setCameraReady(false);
              setError("Camera permission is required for identity verification.");
              setStep("failed");
            }}
          />
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
        {error && (
          <p className="rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-2 text-sm text-[var(--color-danger)]">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {step === "camera" || step === "failed" ? (
            <Button onClick={startChallenge} disabled={!cameraReady}>
              Start identity check
            </Button>
          ) : null}
          {step === "challenge" ? (
            <Button onClick={captureChallengePose}>I turned my head — continue</Button>
          ) : null}
          {step === "confirm" ? (
            <Button onClick={confirmIdentity}>Confirm and verify</Button>
          ) : null}
          {step === "submitting" ? (
            <Button disabled>Verifying…</Button>
          ) : null}
        </div>
      </GlassCard>
    </div>
  );
}
