import { Suspense } from "react";
import { InterviewSessionPageInner } from "./interview-page-inner";

export default function StudentInterviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)]">
          Loading interview…
        </div>
      }
    >
      <InterviewSessionPageInner params={params} />
    </Suspense>
  );
}
