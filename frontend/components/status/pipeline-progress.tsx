import { Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApplicationStage, STAGE_ORDER, STAGE_LABEL } from "@/lib/types/application";

export function PipelineProgress({
  currentStage,
  failedAt,
}: {
  currentStage: ApplicationStage;
  failedAt?: ApplicationStage;
}) {
  const failStage = currentStage === "rejected" ? failedAt ?? "assessment" : undefined;
  const failIndex = failStage ? Math.max(STAGE_ORDER.indexOf(failStage), 0) : -1;
  const terminalAccepted = currentStage === "accepted";
  const currentIndex =
    currentStage === "rejected"
      ? failIndex
      : currentStage === "waitlisted" || terminalAccepted
        ? STAGE_ORDER.length - 1
        : Math.max(STAGE_ORDER.indexOf(currentStage), 0);
  const complete = currentStage === "accepted" || currentStage === "shortlisted";

  return (
    <div className="flex items-center">
      {STAGE_ORDER.map((stage, i) => {
        const isRejectedHere = currentStage === "rejected" && i === failIndex;
        const isWaitlistedHere = currentStage === "waitlisted" && i === currentIndex;
        const done = currentStage === "rejected" ? i < failIndex : i < currentIndex || complete;
        const isCurrent = i === currentIndex && currentStage !== "rejected" && currentStage !== "waitlisted" && currentStage !== "accepted";

        return (
          <div key={stage} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-medium",
                  isRejectedHere && "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
                  isWaitlistedHere && "border-[var(--color-warning)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
                  !isRejectedHere && !isWaitlistedHere && done && "border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]",
                  !isRejectedHere && !isWaitlistedHere && isCurrent && "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
                  !isRejectedHere && !isWaitlistedHere && !done && !isCurrent && "border-[var(--color-border)] text-[var(--color-text-faint)]"
                )}
              >
                {isRejectedHere ? <X size={13} /> : isWaitlistedHere ? <Clock size={13} /> : done ? <Check size={13} /> : i + 1}
              </div>
              <span className="max-w-16 text-center text-[10px] leading-tight text-[var(--color-text-faint)]">
                {STAGE_LABEL[stage]}
              </span>
            </div>
            {i < STAGE_ORDER.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-px flex-1",
                  i < currentIndex || complete ? "bg-[var(--color-success)]/40" : "bg-[var(--color-border)]"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
