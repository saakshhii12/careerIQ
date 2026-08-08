"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { JobForm } from "@/components/recruiter/job-form";
import { useCreateRecruiterJob } from "@/lib/hooks/use-recruiter-jobs";

export default function NewJobPage() {
  const router = useRouter();
  const createMutation = useCreateRecruiterJob();

  return (
    <>
      <Topbar title="Post a new job" subtitle="Set requirements and pipeline thresholds" />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-8">
        <Link
          href="/recruiter/jobs"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-white"
        >
          <ArrowLeft size={14} /> Back to jobs
        </Link>
        <JobForm
          submitLabel="Publish job"
          isSubmitting={createMutation.isPending}
          onSubmit={(input) =>
            createMutation.mutate(input, {
              onSuccess: (job) => router.push(`/recruiter/jobs/${job.id}`),
            })
          }
        />
      </div>
    </>
  );
}
