"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { JobForm } from "@/components/recruiter/job-form";
import { useRecruiterJob, useUpdateRecruiterJob } from "@/lib/hooks/use-recruiter-jobs";

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: job, isLoading } = useRecruiterJob(id);
  const updateMutation = useUpdateRecruiterJob();

  return (
    <>
      <Topbar title={job ? `Edit ${job.title}` : "Edit job"} subtitle="Update requirements and thresholds" />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-8">
        <Link
          href="/recruiter/jobs"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <ArrowLeft size={14} /> Back to jobs
        </Link>

        {isLoading && <div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-bg-elevated)]" />}

        {job && (
          <JobForm
            initial={job}
            submitLabel="Save changes"
            isSubmitting={updateMutation.isPending}
            onSubmit={(input) =>
              updateMutation.mutate(
                { id, ...input },
                { onSuccess: () => router.push(`/recruiter/jobs/${id}`) }
              )
            }
          />
        )}
      </div>
    </>
  );
}
