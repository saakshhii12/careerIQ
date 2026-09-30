import { ApplicationStage, STAGE_LABEL } from "@/lib/types/application";

export function stageTone(stage: ApplicationStage): "success" | "accent" | "warning" | "danger" | "neutral" {
  switch (stage) {
    case "accepted":
    case "shortlisted":
      return "success";
    case "rejected":
      return "danger";
    case "waitlisted":
      return "warning";
    case "review":
      return "accent";
    default:
      return "accent";
  }
}

export { STAGE_LABEL };
