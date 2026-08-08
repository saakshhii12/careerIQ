"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileText, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ResumeState } from "@/lib/types/resume";

const STATUS_COPY: Record<ResumeState["status"], { title: string; body: string }> = {
  none: {
    title: "Upload your resume",
    body: "PDF only, up to 5MB. We'll take it from there.",
  },
  uploading: {
    title: "Uploading…",
    body: "Hang tight, your file is on its way.",
  },
  analyzing: {
    title: "Analyzing your resume",
    body: "Our AI is reading your resume and updating your profile in the background.",
  },
  complete: {
    title: "Resume received",
    body: "Your profile has been updated. Upload a new version any time to refresh it.",
  },
  error: {
    title: "Upload failed",
    body: "Something went wrong. Please try again.",
  },
};

export function ResumeUpload({
  state,
  onUpload,
  isUploading,
}: {
  state: ResumeState;
  onUpload: (file: File) => void;
  isUploading: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const copy = STATUS_COPY[state.status];
  const isProcessing = state.status === "uploading" || state.status === "analyzing";

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (file.type !== "application/pdf") return;
      onUpload(file);
    },
    [onUpload]
  );

  return (
    <GlassCard glow className="mx-auto flex max-w-xl flex-col items-center gap-6 !p-10 text-center">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => !isProcessing && inputRef.current?.click()}
        className={cn(
          "flex w-full cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-8 py-12 transition-colors",
          dragOver ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5" : "border-white/15",
          isProcessing && "pointer-events-none opacity-80"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
          {state.status === "complete" ? (
            <CheckCircle2 size={28} />
          ) : isProcessing ? (
            <Loader2 size={28} className="animate-spin" />
          ) : (
            <UploadCloud size={28} />
          )}
        </div>

        <div>
          <h3 className="text-base font-medium text-white">{copy.title}</h3>
          <p className="mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">{copy.body}</p>
        </div>

        {state.fileName && (
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-[var(--color-text-muted)]">
            <FileText size={13} />
            {state.fileName}
          </div>
        )}

        {!isProcessing && (
          <Button size="sm" variant={state.status === "complete" ? "secondary" : "primary"} disabled={isUploading}>
            {state.status === "complete" ? (
              <>
                <RefreshCw size={14} /> Replace resume
              </>
            ) : (
              <>
                <UploadCloud size={14} /> Choose PDF
              </>
            )}
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
