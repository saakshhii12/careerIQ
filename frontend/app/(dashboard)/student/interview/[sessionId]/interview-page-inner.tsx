"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { InterviewSession } from "@/components/interview/interview-session";

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
