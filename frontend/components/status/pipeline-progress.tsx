import { Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApplicationStage, STAGE_ORDER, STAGE_LABEL } from "@/lib/types/application";

export function PipelineProgress({ currentStage }: { currentStage: ApplicationStage }) {
  const terminal = currentStage === "rejected" || currentStage === "waitlisted" || currentStage === "accepted";
  const currentIndex = terminal
    ? STAGE_ORDER.length - 1
    : STAGE_ORDER.indexOf(currentStage);

  return (
    <div className="flex items-center">
      {STAGE_ORDER.map((stage, i) => {
        const isRejectedHere = currentStage === "rejected" && i === currentIndex;
        const isWaitlistedHere = currentStage === "waitlisted" && i === currentIndex;
        const done = i < currentIndex || currentStage === "accepted";
        const isCurrent = i === currentIndex && !terminal;

        return (
          <div key={stage} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-medium",
                  isRejectedHere && "border-[var(--color-danger)] bg-[var(--color-danger)]/15 text-[var(--color-danger)]",
                  isWaitlistedHere && "border-[var(--color-warning)] bg-[var(--color-warning)]/15 text-[var(--color-warning)]",
                  !isRejectedHere && !isWaitlistedHere && done && "border-[var(--color-success)] bg-[var(--color-success)]/15 text-[var(--color-success)]",
                  !isRejectedHere && !isWaitlistedHere && isCurrent && "border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)]",
                  !isRejectedHere && !isWaitlistedHere && !done && !isCurrent && "border-white/15 text-[var(--color-text-faint)]"
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
                  i < currentIndex || currentStage === "accepted" ? "bg-[var(--color-success)]/50" : "bg-white/10"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
