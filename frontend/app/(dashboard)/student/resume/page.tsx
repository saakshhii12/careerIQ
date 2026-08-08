"use client";

import { Topbar } from "@/components/layout/topbar";
import { ResumeUpload } from "@/components/resume/resume-upload";
import { useResumeStatus, useUploadResume } from "@/lib/hooks/use-resume";

export default function ResumePage() {
  const { data: state } = useResumeStatus();
  const uploadMutation = useUploadResume();

  return (
    <>
      <Topbar title="Resume" subtitle="Upload once — we handle the analysis" />
      <div className="flex flex-1 items-center justify-center p-8">
        <ResumeUpload
          state={state ?? { status: "none" }}
          onUpload={(file) => uploadMutation.mutate(file)}
          isUploading={uploadMutation.isPending}
        />
      </div>
    </>
  );
}
