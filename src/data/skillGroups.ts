export interface SkillGroupDef {
  categoryId: string;
  emoji: string;
  label: string;
}

export const skillGroups: SkillGroupDef[] = [
  { categoryId: "negocios-financas", emoji: "💼", label: "Negócios & Finanças" },
  { categoryId: "juridico-compliance", emoji: "⚖️", label: "Jurídico & Compliance" },
  { categoryId: "tecnologia-dev", emoji: "💻", label: "Tecnologia & Dev" },
  { categoryId: "marketing-vendas", emoji: "📈", label: "Marketing & Vendas" },
  { categoryId: "conteudo-criatividade", emoji: "🎨", label: "Conteúdo & Criatividade" },
  { categoryId: "saude-bemestar", emoji: "🏥", label: "Saúde & Bem-estar" },
  { categoryId: "educacao-carreira", emoji: "🎓", label: "Educação & Carreira" },
  { categoryId: "nichos-brasil", emoji: "🇧🇷", label: "Nichos Brasil" },
];
