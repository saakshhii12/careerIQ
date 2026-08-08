import { ApplicationStage, STAGE_LABEL } from "@/lib/types/application";

export function stageTone(stage: ApplicationStage): "success" | "accent" | "warning" | "danger" | "neutral" {
  switch (stage) {
    case "accepted":
      return "success";
    case "rejected":
      return "danger";
    case "waitlisted":
      return "warning";
    case "applied":
      return "neutral";
    default:
      return "accent";
  }
}

export { STAGE_LABEL };
