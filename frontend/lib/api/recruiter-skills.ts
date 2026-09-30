import { apiClient } from "./client";

export interface SkillCatalogEntry {
  skill_id: number;
  skill_name: string;
  category: string | null;
}

export async function getRecruiterSkillCatalog(query?: string): Promise<SkillCatalogEntry[]> {
  const q = query?.trim();
  const path = q ? `/recruiters/skills?q=${encodeURIComponent(q)}` : "/recruiters/skills";
  const data = await apiClient<{ skills: SkillCatalogEntry[] }>(path);
  return data.skills;
}
