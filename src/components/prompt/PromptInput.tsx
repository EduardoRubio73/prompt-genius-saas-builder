import { useState } from "react";
import type { Enums } from "@/integrations/supabase/types";
import type { MistoFields } from "@/pages/misto/MistoMode";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { ChevronDown } from "lucide-react";
import { useSkills, findSkillById } from "@/hooks/useSkills";

type DbPlatform = Enums<"destination_platform">;

interface PlatformOption {
  id: string;
  name: string;
  emoji: string;
  dbValue: DbPlatform;
}

const platformGroups: { label: string; groupKey: string; items: PlatformOption[] }[] = [
  {
    label: "🏗️ Builders",
    groupKey: "builders",
    items: [
      { id: "lovable", name: "Lovable", emoji: "❤️", dbValue: "lovable" },
      { id: "bolt", name: "Bolt.new", emoji: "⚡", dbValue: "outro" },
      { id: "replit", name: "Replit", emoji: "🔁", dbValue: "outro" },
      { id: "v0", name: "v0.dev", emoji: "▲", dbValue: "v0" },
      { id: "builders-outros", name: "Outros", emoji: "➕", dbValue: "outro" },
    ],
  },
  {
    label: "💻 IDEs",
    groupKey: "ides",
    items: [
      { id: "cursor", name: "Cursor", emoji: "🖱️", dbValue: "cursor" },
      { id: "windsurf", name: "Windsurf", emoji: "🏄", dbValue: "outro" },
      { id: "copilot", name: "GitHub Copilot", emoji: "🐙", dbValue: "outro" },
      { id: "ides-outros", name: "Outros", emoji: "➕", dbValue: "outro" },
    ],
  },
  {
    label: "🤖 LLMs",
    groupKey: "llms",
    items: [
      { id: "chatgpt", name: "ChatGPT", emoji: "🟢", dbValue: "chatgpt" },
      { id: "claude", name: "Claude", emoji: "🟠", dbValue: "claude" },
      { id: "gemini", name: "Gemini", emoji: "✨", dbValue: "gemini" },
      { id: "grok", name: "Grok", emoji: "𝕏", dbValue: "outro" },
      { id: "deepseek", name: "DeepSeek", emoji: "🔵", dbValue: "outro" },
      { id: "mistral", name: "Mistral", emoji: "🌪️", dbValue: "outro" },
      { id: "perplexity", name: "Perplexity", emoji: "🔍", dbValue: "outro" },
      { id: "llms-outros", name: "Outros", emoji: "➕", dbValue: "outro" },
    ],
  },
];

const fieldDefs = [
  { key: "especialidade" as const, icon: "🎓", label: "Especialidade", placeholder: "Ex: Engenheiro de Software Sênior", tip: "Qual o perfil técnico da IA? Ex: Dev Backend, Designer UX, PM" },
  { key: "persona" as const, icon: "👤", label: "Persona", placeholder: "Ex: Técnico e direto ao ponto", tip: "Tom e estilo da resposta. Ex: Didático, Conciso, Criativo" },
  { key: "tarefa" as const, icon: "✅", label: "Tarefa", placeholder: "Ex: Criar arquitetura de microserviços", tip: "O que a IA deve fazer? Seja específico na ação desejada" },
  { key: "objetivo" as const, icon: "🎯", label: "Objetivo", placeholder: "Ex: Sistema escalável e performante", tip: "Resultado esperado. Ex: Código limpo, Documentação completa" },
  { key: "contexto" as const, icon: "🌐", label: "Contexto", placeholder: "Ex: Startup com 10 devs, stack Node.js", tip: "Informações de fundo: stack, equipe, restrições, domínio" },
  { key: "destino" as const, icon: "🚀", label: "Destino (override)", placeholder: "Deixe vazio para usar a seleção abaixo", tip: "Sobrescreve a plataforma selecionada abaixo, se preenchido" },
];

interface PromptInputProps {
  freeText: string;
  onFreeTextChange: (v: string) => void;
  manualFields: MistoFields;
  onManualFieldsChange: (f: MistoFields) => void;
  inputMode: "free" | "manual" | "skills";
  onInputModeChange: (m: "free" | "manual" | "skills") => void;
  destino: Enums<"destination_platform">;
  onDestinoChange: (v: Enums<"destination_platform">) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  selectedSkill: string | null;
  onSelectedSkillChange: (skill: string | null) => void;
  skillComplement: string;
  onSkillComplementChange: (v: string) => void;
}

export function PromptInput({
  freeText, onFreeTextChange,
  manualFields, onManualFieldsChange,
  inputMode, onInputModeChange,
  destino, onDestinoChange,
  onGenerate, isGenerating,
  selectedSkill, onSelectedSkillChange,
  skillComplement, onSkillComplementChange,
}: PromptInputProps) {
  const freeLen = freeText.length;
  const manualFilled = Object.values(manualFields).filter(v => v.length > 2).length;
  const canGenerate =
    inputMode === "free"
      ? freeLen >= 30 && freeLen <= 1200 && !isGenerating
      : inputMode === "manual"
        ? manualFilled >= 3 && !isGenerating
        : selectedSkill !== null && !isGenerating;

  const [selectedPlatformId, setSelectedPlatformId] = useState("lovable");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ "🏗️ Builders": true });
  const [customPlatforms, setCustomPlatforms] = useState<Record<string, string>>({
    builders: "",
    ides: "",
    llms: "",
  });
  const [skillsOpen, setSkillsOpen] = useState(true);

  const skillCategories = useSkills();

  const toggleGroup = (group: string) =>
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));

  const selectPlatform = (p: PlatformOption) => {
    setSelectedPlatformId(p.id);
    onDestinoChange(p.dbValue);
  };

  const toggleSkill = (skillId: string) => {
    if (selectedSkill === skillId) {
      onSelectedSkillChange(null);
      onSkillComplementChange("");
    } else {
      onSelectedSkillChange(skillId);
    }
  };

  const selectedSkillData = findSkillById(selectedSkill);

  // Filter platform groups based on mode
  const visiblePlatformGroups = inputMode === "skills"
    ? platformGroups.filter(g => g.groupKey === "llms")
    : platformGroups;

  return (
    <div className="misto-step-enter">
      {/* Mode toggle */}
      <div className="misto-res-tabs" style={{ marginBottom: 20 }}>
        <button className={`misto-rt ${inputMode === "free" ? "on" : ""}`} onClick={() => onInputModeChange("free")}>
          💡 Texto Livre
        </button>
        <button className={`misto-rt ${inputMode === "manual" ? "on" : ""}`} onClick={() => onInputModeChange("manual")}>
          📝 Campos Manuais
        </button>
        <button
          className={`misto-rt tab-skills ${inputMode === "skills" ? "on" : ""}`}
          onClick={() => onInputModeChange("skills")}
        >
          🧠 Skills & Agentes
        </button>
      </div>

      {/* Free text mode */}
      {inputMode === "free" && (
        <div className="prompt-panel">
          <div className="misto-input-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            💡 Descreva o que precisa
            <InfoTooltip content="Descreva em linguagem natural. A IA extrai automaticamente especialidade, persona, tarefa e outros campos. Mínimo 30 caracteres." />
          </div>
          <textarea
            className="misto-textarea"
            placeholder="Descreva o que você precisa em texto livre. A IA vai extrair os campos automaticamente e gerar o prompt otimizado..."
            value={freeText}
            onChange={(e) => onFreeTextChange(e.target.value.slice(0, 1200))}
            disabled={isGenerating}
            style={{ minHeight: 220 }}
          />
          <div className={`misto-char-count ${freeLen < 30 ? "warning" : ""}`}>
            {freeLen} / 1200 {freeLen < 30 && "(mín. 30)"}
          </div>
        </div>
      )}

      {/* Manual fields mode */}
      {inputMode === "manual" && (
        <div className="prompt-panel">
          <div className="misto-input-label">📝 Preencha os campos diretamente</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {fieldDefs.map((f) => (
              <div key={f.key} className="prompt-field-group">
                <div className="prompt-field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {f.icon} {f.label}
                  <InfoTooltip content={f.tip} />
                </div>
                <input
                  className="prompt-field-input"
                  placeholder={f.placeholder}
                  value={manualFields[f.key]}
                  onChange={(e) => onManualFieldsChange({ ...manualFields, [f.key]: e.target.value })}
                  disabled={isGenerating}
                />
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "hsl(var(--mode-text-muted))", marginTop: 8 }}>
            Preencha pelo menos 3 campos para gerar ({manualFilled}/6 preenchidos)
          </div>
        </div>
      )}

      {/* Platform selector — filtered by mode */}
      <div style={{ marginTop: 20 }}>
        <div className="misto-destino-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          🚀 Plataforma de destino
          <InfoTooltip content="Escolha onde o prompt será usado. Cada plataforma tem otimizações específicas de formato e linguagem." />
        </div>
        <div className="platform-groups">
          {visiblePlatformGroups.map((group) => (
            <div key={group.label} className={`platform-group ${openGroups[group.label] ? "open" : ""}`}>
              <button
                className="platform-group-header"
                onClick={() => toggleGroup(group.label)}
                type="button"
              >
                <span>{group.label}</span>
                <ChevronDown className={`platform-group-chevron ${openGroups[group.label] ? "rotated" : ""}`} />
              </button>
              {openGroups[group.label] && (
                <div>
                  <div className="platform-group-pills">
                    {group.items.map((p) => (
                      <button
                        key={p.id}
                        className={`misto-dp ${selectedPlatformId === p.id ? "sel" : ""}`}
                        onClick={() => selectPlatform(p)}
                        type="button"
                      >
                        {p.emoji} {p.name}
                      </button>
                    ))}
                  </div>
                  {selectedPlatformId === `${group.groupKey}-outros` && (
                    <input
                      className="prompt-field-input"
                      placeholder="Digite a plataforma ou deixe em branco para prompt genérico..."
                      value={customPlatforms[group.groupKey] || ""}
                      onChange={(e) => setCustomPlatforms(prev => ({ ...prev, [group.groupKey]: e.target.value }))}
                      style={{
                        width: "100%",
                        marginTop: 8,
                        borderRadius: 20,
                        fontSize: 13,
                        transition: "all 0.2s",
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Skills & Agentes — only in skills mode */}
      {inputMode === "skills" && (
        <div style={{ marginTop: 20 }}>
          <div className={`skills-card ${skillsOpen ? "open" : ""}`}>
            <button
              className="skills-header"
              onClick={() => setSkillsOpen(o => !o)}
              type="button"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>🧠 Skills & Agentes</span>
                <span className="skills-badge">NOVO</span>
              </div>
              <ChevronDown className={`platform-group-chevron ${skillsOpen ? "rotated" : ""}`} />
            </button>
            {skillsOpen && (
              <div className="skills-body">
                {skillCategories.map((cat) => (
                  <div key={cat.id} style={{ marginBottom: 14 }}>
                    <div className="skills-category-label">{cat.label}</div>
                    <div className="skills-pills">
                      {cat.skills.map((skill) => (
                        <button
                          key={skill.id}
                          type="button"
                          className={`skill-pill ${selectedSkill === skill.id ? "active" : ""}`}
                          onClick={() => toggleSkill(skill.id)}
                        >
                          {skill.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Complement card — appears when a skill is selected in skills mode */}
      {inputMode === "skills" && selectedSkill && selectedSkillData && (
        <div className="complement-card" style={{ marginTop: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <span className="selected-skill-tag">{selectedSkillData.label}</span>
          </div>
          <div className="card-hint">
            O agente já possui instruções especializadas. Use este campo apenas para complementar com detalhes do seu caso específico.
          </div>
          <textarea
            className="misto-textarea"
            placeholder="Adicione detalhes do seu caso específico, contexto adicional, restrições ou preferências..."
            value={skillComplement}
            onChange={(e) => onSkillComplementChange(e.target.value.slice(0, 1200))}
            disabled={isGenerating}
            style={{ minHeight: 120, marginTop: 12 }}
          />
          <div className="misto-char-count">
            {skillComplement.length} / 1200
          </div>
        </div>
      )}

      <button className="misto-gen-btn" onClick={onGenerate} disabled={!canGenerate} type="button">
        ✨ Gerar Prompt — 1 cota
      </button>
    </div>
  );
}
