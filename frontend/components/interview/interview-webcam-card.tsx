"use client";

import { useEffect, useRef } from "react";
import Webcam from "react-webcam";
import { GlassCard } from "@/components/ui/glass-card";

const videoConstraints = { width: 640, height: 360, facingMode: "user" };

interface InterviewWebcamCardProps {
  cameraStatus: string;
  integrityMonitorStatus?: string;
  onStatusChange: (status: string, reason?: { type: string; message: string }) => void;
  webcamRef: React.RefObject<Webcam | null>;
  onPermissionActivity?: () => void;
}

export function InterviewWebcamCard({
  cameraStatus,
  integrityMonitorStatus,
  onStatusChange,
  webcamRef,
  onPermissionActivity,
}: InterviewWebcamCardProps) {
  const streamRef = useRef<MediaStream | null>(null);
  const permissionNotified = useRef(false);

  useEffect(() => {
    // One-shot suppress before getUserMedia permission prompt.
    if (!permissionNotified.current) {
      permissionNotified.current = true;
      onPermissionActivity?.();
    }
  }, [onPermissionActivity]);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    []
  );

  const handleUserMedia = (stream: MediaStream) => {
    streamRef.current = stream;
    onPermissionActivity?.();
    onStatusChange("Connected");
    stream.getVideoTracks().forEach((track) =>
      track.addEventListener("ended", () =>
        onStatusChange("Disconnected", {
          type: "CAMERA_DISCONNECTED",
          message: "Camera feed is unavailable. Please enable and position your camera correctly.",
        })
      )
    );
  };

  const handleError = (error: DOMException | string) => {
    onPermissionActivity?.();
    const err = typeof error === "string" ? ({ name: "" } as DOMException) : error;
    const denied = err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError";
    onStatusChange(denied ? "Permission denied" : "Error", {
      type: denied ? "CAMERA_PERMISSION_DENIED" : "CAMERA_UNAVAILABLE",
      message: denied
        ? "Camera permission was denied. Please allow camera access to continue."
        : "Camera feed is unavailable. Please enable and position your camera correctly.",
    });
  };

  return (
    <GlassCard className="space-y-2 !p-3">
      <div>
        <p className="text-sm font-medium text-[var(--color-text)]">Camera preview</p>
        <p className="text-xs text-[var(--color-text-muted)]">Live security monitoring</p>
      </div>
      <div className="overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="aspect-video w-full object-cover"
          onUserMedia={handleUserMedia}
          onUserMediaError={handleError}
        />
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">Camera: {cameraStatus}</p>
      <p className="text-xs text-[var(--color-text-muted)]">
        Security: {integrityMonitorStatus || "Idle"}
      </p>
    </GlassCard>
  );
}
