import skillsData from "@/data/skills-data.json";

export interface Skill {
  id: string;
  label: string;
  systemPrompt: string;
}

export interface SkillCategory {
  id: string;
  label: string;
  skills: Skill[];
}

const categories = skillsData.categories as SkillCategory[];

export function useSkills(): SkillCategory[] {
  return categories;
}

export function findSkillById(id: string | null): Skill | null {
  if (!id) return null;
  for (const cat of categories) {
    const found = cat.skills.find((s) => s.id === id);
    if (found) return found;
  }
  return null;
}
