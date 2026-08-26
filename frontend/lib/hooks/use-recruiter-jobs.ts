"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRecruiterJobs,
  getRecruiterJobById,
  createRecruiterJob,
  updateRecruiterJob,
  setRecruiterJobStatus,
  deleteRecruiterJob,
} from "@/lib/api/recruiter-jobs";
import { RecruiterJob } from "@/lib/types/recruiter-job";

export function useRecruiterJobs() {
  return useQuery({
    queryKey: ["recruiter", "jobs"],
    queryFn: getRecruiterJobs,
  });
}

export function useRecruiterJob(id: string) {
  return useQuery({
    queryKey: ["recruiter", "jobs", id],
    queryFn: () => getRecruiterJobById(id),
  });
}

export function useCreateRecruiterJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRecruiterJob,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recruiter", "jobs"] }),
  });
}

export function useUpdateRecruiterJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Parameters<typeof updateRecruiterJob>[1]) =>
      updateRecruiterJob(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recruiter", "jobs"] }),
  });
}

export function useSetRecruiterJobStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RecruiterJob["status"] }) =>
      setRecruiterJobStatus(id, status),
    onMutate: ({ id, status }) => {
      queryClient.setQueryData<RecruiterJob[]>(["recruiter", "jobs"], (old) =>
        old?.map((j) => (j.id === id ? { ...j, status } : j))
      );
    },
  });
}

export function useDeleteRecruiterJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRecruiterJob,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recruiter", "jobs"] }),
  });
}
