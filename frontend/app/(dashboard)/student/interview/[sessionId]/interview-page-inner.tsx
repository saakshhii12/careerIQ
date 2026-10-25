"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamically import InterviewSession so that all of its heavy dependencies
// (@tensorflow, @mediapipe/tasks-vision, react-webcam, etc.) are split into a
// separate JS chunk. The chunk is only downloaded and compiled when the user
// actually navigates to an interview session, eliminating the 20-30 second
// compilation delay on other dashboard pages.
const InterviewSession = dynamic(
  () =>
    import("@/components/interview/interview-session").then((m) => ({
      default: m.InterviewSession,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-sm text-[var(--color-text-muted)]">
        Loading interview…
      </div>
    ),
  }
);

export function InterviewSessionPageInner({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("applicationId") ?? undefined;

  return <InterviewSession sessionId={sessionId} applicationId={applicationId} />;
}
