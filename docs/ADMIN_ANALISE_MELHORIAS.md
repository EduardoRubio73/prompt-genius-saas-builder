# 🔍 Análise & Melhorias — Admin Panel

## O que foi feito (pontos positivos)

- ✅ Estrutura de rotas completa com React Router v6
- ✅ React Query com invalidação de cache nos CRUDs
- ✅ Light/Dark mode via ThemeContext
- ✅ Sidebar colapsável com tooltips
- ✅ CRUD completo em Usuários, Orgs, Billing, Flags, AI Config
- ✅ KPIs no Overview com dados reais
- ✅ Audit Logs com filtros por resource type
- ✅ Badges semânticos (plan, status) via CSS classes reutilizáveis
- ✅ Paginação client-side em todas as tabelas
- ✅ Dados mock bem estruturados para desenvolvimento

---

## Problemas identificados

### 🔴 Críticos (funcionais)

#### 1. `AdminAIConfig.tsx` duplica lógica de Feature Flags
O `AdminFlags.tsx` já gerencia Feature Flags completamente (381 linhas), mas o `AdminAIConfig.tsx` (574 linhas) inclui **uma segunda implementação completa** de CRUD de flags. Isso gera:
- Dois estados separados para a mesma entidade
- Mutations duplicadas (`useCreateFeatureFlag` chamado em dois lugares)
- Risco de inconsistência entre as telas

**Correção:** Remover a seção de flags do `AdminAIConfig.tsx`. Manter apenas Settings de IA (API keys, model configs, parâmetros).

#### 2. `AdminBilling.tsx` mistura Planos e Assinaturas sem separação clara
O arquivo tem 776 linhas com tabs "Assinaturas" e "Planos", mas:
- A aba de Planos gerencia `billing_products` enquanto o schema usa `billing_products` + `billing_prices` separados
- Não há visualização de `billing_invoices` em nenhuma tela
- O CRUD de planos cria produtos sem preços associados

**Correção:** Adicionar aba "Faturas" e separar a criação de produto da criação de preço.

#### 3. Sidebar sem indicação de contagem/alertas
Não há nenhum badge de notificação na sidebar para alertar o admin sobre:
- Usuários com plano expirado
- Feature flags com rollout parcial ativo
- Assinaturas `past_due`

#### 4. Nenhuma validação de formulários
Todos os dialogs de CRUD usam state local sem validação. Exemplo: criar usuário sem email, criar feature flag com `flag` vazio, etc.

---

### 🟡 UX/UI (experiência)

#### 5. Overview sem gráfico de sessões funcional
O gráfico de barras está implementado mas sem labels nos eixos Y e sem tooltip com valor exato ao hover. As barras não têm animação de entrada.

#### 6. Tabelas sem coluna de ações visível — tudo em dropdown
Em todas as tabelas, **todas as ações** estão dentro de um `DropdownMenu` com `MoreHorizontal`. Para operações frequentes como "Editar", seria melhor ter o botão de edição diretamente na linha com ícone, e apenas "Excluir" (destrutivo) no dropdown.

#### 7. Paginação não mostra total de registros
O componente de paginação mostra apenas "< Anterior | Próximo >" sem indicar "Mostrando 1-20 de 847 registros".

#### 8. Sem feedback visual de loading por linha
Ao clicar em deletar/editar, não há skeleton/spinner na linha afetada — o usuário não sabe se a ação está sendo processada.

#### 9. `AdminPrompts.tsx` não tem botão "Exportar"
O header mostra botão `Download` no UI mas ele não faz nada (sem handler).

#### 10. `AdminLayout` — botão de colapso usa ícone errado
O botão que colapsa/expande a sidebar usa `<LayoutGrid />` que é o mesmo ícone do menu "Dashboard". Deveria usar `<PanelLeftClose />` / `<PanelLeftOpen />`.

#### 11. Header sem busca global
Admins geralmente precisam buscar por usuário/org sem navegar de tela. Não há busca global no header.

#### 12. Nenhuma tela de "Detalhe do Usuário"
Ao clicar num usuário só abre o dialog de edição. Não há uma página `/admin/users/:id` com histórico de sessões, prompts, consumo e billing do usuário.

---

### 🟢 Melhorias de código

#### 13. `PlanBadge` e `StatusBadge` duplicados
Estão definidos localmente em `AdminOverview`, `AdminUsers` e `AdminOrganizations`. Deveriam ser componentes compartilhados em `src/components/admin/badges.tsx`.

#### 14. Mock data dentro do `adminService.ts`
O arquivo de serviço começa com 80+ linhas de mock data hardcoded misturado com a lógica de serviço. Isso deve ser separado em `src/mocks/adminMocks.ts`.

#### 15. Sem tratamento de erro nas mutations
Nenhuma mutation tem `onError` configurado. Se uma operação falha, o toast de sucesso ainda dispara em alguns casos.

---

## Prioridade de implementação

### FASE 1 — Correções críticas (fazer primeiro)

| # | Tarefa | Arquivo(s) |
|---|--------|-----------|
| 1 | Extrair `PlanBadge` e `StatusBadge` para `src/components/admin/Badges.tsx` | Novo arquivo + refatorar 3 páginas |
| 2 | Corrigir ícone do botão de colapso da sidebar | `AdminLayout.tsx` |
| 3 | Remover seção duplicada de Feature Flags do `AdminAIConfig` | `AdminAIConfig.tsx` |
| 4 | Adicionar `onError` em todas as mutations | `useAdminData.ts` |
| 5 | Corrigir botão Export em `AdminPrompts` | `AdminPrompts.tsx` |

### FASE 2 — Melhorias de UX (alta prioridade)

| # | Tarefa | Arquivo(s) |
|---|--------|-----------|
| 6 | Mostrar total de registros na paginação | Todas as tabelas |
| 7 | Expor botão "Editar" diretamente na linha (não só no dropdown) | `AdminUsers`, `AdminOrganizations` |
| 8 | Melhorar gráfico de sessões com labels Y + tooltip + animação | `AdminOverview.tsx` |
| 9 | Adicionar badges de alerta na sidebar (past_due, flags ativas) | `AdminLayout.tsx` |
| 10 | Adicionar busca global no header | `AdminLayout.tsx` |

### FASE 3 — Novas funcionalidades

| # | Tarefa | Arquivo(s) |
|---|--------|-----------|
| 11 | Página de detalhe do usuário `/admin/users/:id` | Novo arquivo |
| 12 | Aba "Faturas" em `AdminBilling` com listagem de `billing_invoices` | `AdminBilling.tsx` |
| 13 | Validação de formulários com Zod + React Hook Form | Todos os dialogs |
| 14 | Separar mock data do service | `adminService.ts` → `adminMocks.ts` |

---

## Detalhamento das correções — Fase 1

### FIX 1 — Componentes compartilhados de badges

Criar `src/components/admin/Badges.tsx`:

```tsx
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';

export function PlanBadge({ tier }: { tier: string | null }) {
  const styles: Record<string, string> = {
    pro: 'plan-pro',
    starter: 'plan-starter',
    enterprise: 'plan-enterprise',
    free: 'plan-free',
  };
  const t = tier || 'free';
  return (
    <Badge variant="outline" className={`text-[10px] font-medium capitalize ${styles[t] ?? styles.free}`}>
      {t}
    </Badge>
  );
}

export function StatusBadge({ active, labelTrue = 'Ativo', labelFalse = 'Inativo' }: {
  active: boolean;
  labelTrue?: string;
  labelFalse?: string;
}) {
  return active ? (
    <Badge variant="outline" className="status-success text-[10px]">
      <CheckCircle2 className="mr-1 h-3 w-3" />
      {labelTrue}
    </Badge>
  ) : (
    <Badge variant="outline" className="status-error text-[10px]">
      <XCircle className="mr-1 h-3 w-3" />
      {labelFalse}
    </Badge>
  );
}

export function SubStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'status-success',
    trialing: 'status-info',
    past_due: 'status-warning',
    canceled: 'status-error',
    paused: 'status-warning',
  };
  const labels: Record<string, string> = {
    active: 'Ativo',
    trialing: 'Trial',
    past_due: 'Inadimplente',
    canceled: 'Cancelado',
    paused: 'Pausado',
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[status] || 'bg-muted'}`}>
      {labels[status] || status}
    </Badge>
  );
}
```

Substituir todas as definições locais de `PlanBadge` e `StatusBadge` em:
- `AdminOverview.tsx`
- `AdminUsers.tsx`
- `AdminOrganizations.tsx`
- `AdminBilling.tsx`

---

### FIX 2 — Ícone correto no botão de colapso da sidebar

Em `AdminLayout.tsx`, trocar o import e o ícone:

```tsx
// Adicionar ao import:
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

// Substituir o botão de colapso:
<Button
  variant="ghost"
  size="icon"
  className="h-8 w-8 text-muted-foreground hover:text-foreground"
  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
  title={isSidebarCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
>
  {isSidebarCollapsed
    ? <PanelLeftOpen className="h-4 w-4" />
    : <PanelLeftClose className="h-4 w-4" />
  }
</Button>
```

---

### FIX 3 — Remover Feature Flags duplicados do AdminAIConfig

Em `AdminAIConfig.tsx`:

1. Remover os imports: `useAdminFeatureFlags`, `useCreateFeatureFlag`, `useUpdateFeatureFlag`, `useDeleteFeatureFlag`
2. Remover os estados: `isCreateFlagDialogOpen`, `isEditFlagDialogOpen`, `isDeleteFlagDialogOpen`, `selectedFlag`, `flagForm`
3. Remover a aba "Feature Flags" do `<Tabs>` e o `<TabsContent value="flags">` inteiro
4. Manter apenas as abas: "Configurações" e "Modelos de IA"
5. Adicionar um link de atalho no lugar:

```tsx
// No lugar da aba de flags, adicionar na aba de Configurações:
<div className="mt-6 pt-4 border-t border-border">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium">Feature Flags</p>
      <p className="text-xs text-muted-foreground">Gerencie os feature flags na página dedicada</p>
    </div>
    <Button variant="outline" size="sm" onClick={() => navigate('/admin/flags')} className="gap-2">
      <Flag className="h-4 w-4" /> Gerenciar Flags
    </Button>
  </div>
</div>
```

---

### FIX 4 — Adicionar `onError` nas mutations

Em `useAdminData.ts`, todas as mutations devem seguir o padrão:

```ts
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'kpis'] });
    },
    onError: (error: Error) => {
      console.error('Create user failed:', error);
      // O toast de erro deve ser disparado no componente, não aqui,
      // para manter o hook agnóstico de UI
    },
  });
}
```

Nos componentes, trocar o padrão:
```tsx
// ANTES (sem tratamento de erro):
try {
  await createUser.mutateAsync(formData);
  toast({ title: 'Sucesso', description: 'Usuário criado!' });
} catch (e) {
  // silencioso
}

// DEPOIS (com tratamento):
try {
  await createUser.mutateAsync(formData);
  toast({ title: 'Sucesso', description: 'Usuário criado!' });
  setIsCreateDialogOpen(false);
} catch (error) {
  toast({
    title: 'Erro',
    description: error instanceof Error ? error.message : 'Operação falhou.',
    variant: 'destructive',
  });
}
```

---

### FIX 5 — Exportar CSV de prompts

Em `AdminPrompts.tsx`, substituir o botão inativo por:

```tsx
const handleExport = () => {
  if (!prompts?.data?.length) return;
  
  const headers = ['ID', 'Usuário', 'Email', 'Especialidade', 'Destino', 'Rating', 'Tokens', 'Criado em'];
  const rows = prompts.data.map(p => [
    p.id,
    p.user_name || '',
    p.user_email,
    p.especialidade || '',
    p.destino || '',
    p.rating || '',
    p.tokens_consumed || 0,
    new Date(p.created_at).toLocaleDateString('pt-BR'),
  ]);
  
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prompts_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// No JSX, substituir o botão Download:
<Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
  <Download className="h-4 w-4" />
  Exportar CSV
</Button>
```

---

## Detalhamento das melhorias — Fase 2

### MELHORIA 6 — Paginação com total de registros

Adicionar em todas as tabelas paginadas, substituindo o footer de paginação atual:

```tsx
{/* Footer de paginação melhorado */}
<div className="flex items-center justify-between pt-4">
  <p className="text-xs text-muted-foreground">
    Mostrando{' '}
    <span className="font-medium text-foreground">
      {page * perPage + 1}–{Math.min((page + 1) * perPage, totalCount)}
    </span>
    {' '}de{' '}
    <span className="font-medium text-foreground">{totalCount}</span>
    {' '}registros
  </p>
  <div className="flex items-center gap-2">
    <Button
      variant="outline" size="sm"
      onClick={() => setPage(p => Math.max(0, p - 1))}
      disabled={page === 0}
    >
      <ChevronLeft className="h-4 w-4" />
    </Button>
    <span className="text-xs text-muted-foreground font-mono px-2">
      {page + 1} / {totalPages}
    </span>
    <Button
      variant="outline" size="sm"
      onClick={() => setPage(p => p + 1)}
      disabled={(page + 1) * perPage >= totalCount}
    >
      <ChevronRight className="h-4 w-4" />
    </Button>
  </div>
</div>
```

O `adminService` deve retornar `{ data: T[], total: number }` — verificar se já retorna `total` e ajustar onde não retorna.

---

### MELHORIA 7 — Botão de edição diretamente na linha

Em `AdminUsers.tsx` e `AdminOrganizations.tsx`, substituir o padrão de dropdown por:

```tsx
// ANTES: tudo no DropdownMenu
// DEPOIS: botão de edição inline + dropdown apenas para destrutivos

<td className="py-3">
  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      onClick={() => {
        setSelectedUser(u);
        setIsEditDialogOpen(true);
      }}
      title="Editar"
    >
      <Pencil className="h-3.5 w-3.5" />
    </Button>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="text-destructive focus:text-destructive gap-2"
          onClick={() => { setSelectedUser(u); setIsDeleteDialogOpen(true); }}
        >
          <Trash2 className="h-4 w-4" /> Excluir usuário
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</td>
```

Lembrar de adicionar `group` na classe da `<tr>`.

---

### MELHORIA 8 — Gráfico de sessões melhorado

Substituir o gráfico de barras manual no `AdminOverview.tsx` por uma versão com tooltip:

```tsx
<div className="relative">
  <div className="flex items-end gap-1.5" style={{ height: 120 }}>
    {chartData?.map((d, i) => {
      const max = Math.max(...(chartData?.map(x => x.count) ?? [1]), 1);
      const h = Math.max((d.count / max) * 100, 4);
      const isToday = i === (chartData?.length ?? 0) - 1;
      return (
        <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group/bar relative">
          {/* Tooltip */}
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/bar:flex flex-col items-center z-10 pointer-events-none">
            <div className="bg-popover border border-border rounded-md px-2 py-1 text-xs font-mono shadow-md whitespace-nowrap">
              <span className="font-semibold">{d.count}</span> sessões
              <br />
              <span className="text-muted-foreground">{d.day}</span>
            </div>
            <div className="w-2 h-2 bg-popover border-b border-r border-border rotate-45 -mt-1" />
          </div>
          {/* Bar */}
          <div
            className={cn(
              "w-full rounded-t transition-all duration-500 cursor-pointer hover:opacity-80",
              isToday ? "bg-primary" : "bg-primary/25 hover:bg-primary/40"
            )}
            style={{ height: `${h}%` }}
          />
        </div>
      );
    })}
  </div>
  {/* Y-axis hint */}
  <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none">
    {[...Array(3)].map((_, i) => {
      const max = Math.max(...(chartData?.map(x => x.count) ?? [0]), 1);
      const val = Math.round(max * (1 - i / 2));
      return (
        <span key={i} className="text-[9px] text-muted-foreground font-mono -translate-x-full pr-1">
          {val}
        </span>
      );
    })}
  </div>
</div>
```

---

### MELHORIA 9 — Badges de alerta na sidebar

Em `AdminLayout.tsx`, adicionar um hook local para buscar contagens de alerta:

```tsx
// Adicionar no componente AdminLayout:
const { data: kpis } = useAdminKpis();

// Calcular alertas:
const alerts = {
  billing: kpis ? (kpis.past_due_count ?? 0) : 0,
  // Outros alertas conforme disponível nos KPIs
};

// No NavLink de Billing, adicionar badge:
<NavLink to="/admin/billing" ...>
  <CreditCard className="h-4 w-4 shrink-0" />
  {!isSidebarCollapsed && <span>Planos & Billing</span>}
  {!isSidebarCollapsed && alerts.billing > 0 && (
    <span className="ml-auto text-[10px] font-bold bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
      {alerts.billing > 99 ? '99+' : alerts.billing}
    </span>
  )}
</NavLink>
```

---

### MELHORIA 10 — Busca global no header

Em `AdminLayout.tsx`, adicionar no header:

```tsx
import { Command, CommandInput, CommandList, CommandItem, CommandGroup } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// No header, entre o breadcrumb e os ícones:
<div className="flex-1 max-w-xs mx-4">
  <button
    className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
    onClick={() => setSearchOpen(true)}
  >
    <Search className="h-3.5 w-3.5" />
    <span>Buscar usuário, org...</span>
    <kbd className="ml-auto text-[10px] border border-border rounded px-1 font-mono">⌘K</kbd>
  </button>
</div>
```

---

## Resumo executivo para o Lovable

Cole as instruções em ordem. Cada fase deve ser implementada e testada antes da próxima.

**Arquivos a criar:**
- `src/components/admin/Badges.tsx` — componentes de badge compartilhados

**Arquivos a modificar:**
- `AdminLayout.tsx` — ícone de colapso, badges de alerta, busca global
- `AdminOverview.tsx` — importar Badges, melhorar gráfico
- `AdminUsers.tsx` — importar Badges, botão editar inline, paginação com total, onError
- `AdminOrganizations.tsx` — importar Badges, botão editar inline, paginação com total, onError
- `AdminBilling.tsx` — importar Badges, adicionar aba Faturas, onError
- `AdminPrompts.tsx` — exportar CSV funcional, onError
- `AdminAIConfig.tsx` — remover Feature Flags duplicados, onError
- `AdminFlags.tsx` — onError nas mutations
- `useAdminData.ts` — onError em todas as mutations, garantir que `getUsers`, `getOrganizations` retornam `{ data, total }`
