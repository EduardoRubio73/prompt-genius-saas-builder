import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useSkills } from "@/hooks/useSkills";
import { skillGroups } from "@/data/skillGroups";
import { cn } from "@/lib/utils";

interface SkillGroupListProps {
  selectedSkill: string | null;
  onSelectSkill: (id: string | null) => void;
}

export function SkillGroupList({ selectedSkill, onSelectSkill }: SkillGroupListProps) {
  const categories = useSkills();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggle = (id: string) =>
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSkillClick = (skillId: string) => {
    onSelectSkill(selectedSkill === skillId ? null : skillId);
  };

  return (
    <div className="skill-group-list">
      {skillGroups.map((group) => {
        const cat = categories.find((c) => c.id === group.categoryId);
        if (!cat) return null;
        const isOpen = !!openGroups[group.categoryId];

        return (
          <div key={group.categoryId} className="skill-group-item">
            <button
              type="button"
              className="skill-group-header"
              onClick={() => toggle(group.categoryId)}
            >
              <span className="skill-group-header-label">
                {group.emoji} {group.label}
                <span className="skill-group-count">{cat.skills.length}</span>
              </span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            {isOpen && (
              <div className="skill-group-pills">
                {cat.skills.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    className={`skill-pill ${selectedSkill === skill.id ? "active" : ""}`}
                    onClick={() => handleSkillClick(skill.id)}
                  >
                    {skill.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        className="skill-custom-btn"
        onClick={() => onSelectSkill("custom")}
      >
        ➕ Criar Skill Personalizada
      </button>
    </div>
  );
}
