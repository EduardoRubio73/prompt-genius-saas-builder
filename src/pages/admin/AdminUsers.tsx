import { useState } from "react";
import { useAdminUsers, useUpdateProfile, useUpdateOrganization, useAdminCreditTransactions } from "@/hooks/admin/useAdminData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlanBadge, StatusBadge } from "@/components/admin/Badges";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const perPage = 20;

export default function AdminUsers() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { data: users, isLoading } = useAdminUsers(page, debouncedSearch);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout((window as any).__adminSearchTimer);
    (window as any).__adminSearchTimer = setTimeout(() => { setDebouncedSearch(v); setPage(0); }, 300);
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Usuários e Organizações</h2>
        <Input placeholder="Buscar por nome ou email..." value={search} onChange={(e) => handleSearch(e.target.value)}
          className="w-64 border-white/10 bg-[#16161F] text-[13px] text-[#E8E6F0] placeholder:text-white/30" />
      </div>

      <div className="overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0F0F17]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["Usuário", "Plano", "Org", "Prompts", "Specs", "Cadastro", "Status"].map((h) => (
                <th key={h} className="px-5 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-white/40">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="px-5 py-10 text-center text-[12px] text-white/30">Carregando...</td></tr>}
            {users?.map((u) => (
              <tr key={u.user_id} className="group border-b border-white/[0.06] last:border-0 hover:bg-[#16161F] transition cursor-pointer"
                onClick={() => setSelectedUser(u)}>
                <td className="px-5 py-3">
                  <div className="text-[13px] font-medium">{u.full_name || "—"}</div>
                  <div className="text-[11px] text-white/40" style={mono}>{u.email}</div>
                </td>
                <td className="px-5 py-3"><PlanBadge tier={u.plan_tier} /></td>
                <td className="px-5 py-3 text-[12px] text-white/65">{u.org_name || "—"}</td>
                <td className="px-5 py-3 text-[11px] text-white/65" style={mono}>{u.total_prompts ?? 0}</td>
                <td className="px-5 py-3 text-[11px] text-white/65" style={mono}>{u.total_specs ?? 0}</td>
                <td className="px-5 py-3 text-[11px] text-white/40" style={mono}>{u.registered_at ? new Date(u.registered_at).toLocaleDateString("pt-BR") : "—"}</td>
                <td className="px-5 py-3"><StatusBadge active={u.org_active !== false} labelTrue="ativo" labelFalse="inativo" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-[11px] text-white/40">Mostrando <span className="font-medium text-white/65">{page * perPage + 1}–{page * perPage + (users?.length ?? 0)}</span> registros</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="h-7 border-white/10 bg-transparent text-[12px] text-white/65 hover:bg-[#16161F]"><ChevronLeft className="h-3.5 w-3.5" /></Button>
          <span className="text-[11px] text-white/40" style={mono}>Pág. {page + 1}</span>
          <Button variant="outline" size="sm" disabled={!users || users.length < perPage} onClick={() => setPage((p) => p + 1)} className="h-7 border-white/10 bg-transparent text-[12px] text-white/65 hover:bg-[#16161F]"><ChevronRight className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      {selectedUser && <UserDetailDialog user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  );
}

function UserDetailDialog({ user, onClose }: { user: any; onClose: () => void }) {
  const { toast } = useToast();
  const updateProfile = useUpdateProfile();
  const updateOrg = useUpdateOrganization();
  const { data: transactions } = useAdminCreditTransactions(user.org_id);
  const [tab, setTab] = useState<"info" | "edit" | "credits">("info");
  const [form, setForm] = useState({
    full_name: user.full_name || "",
    plan_tier: user.plan_tier || "free",
    account_status: "active",
    is_active: user.org_active !== false,
    plan_credits_total: 0,
    bonus_credits_total: 0,
  });

  const saveChanges = async () => {
    try {
      if (user.user_id) {
        await updateProfile.mutateAsync({ id: user.user_id, updates: { full_name: form.full_name } });
      }
      if (user.org_id) {
        await updateOrg.mutateAsync({
          id: user.org_id,
          updates: {
            plan_tier: form.plan_tier,
            is_active: form.is_active,
            plan_credits_total: form.plan_credits_total || undefined,
            bonus_credits_total: form.bonus_credits_total || undefined,
          },
        });
      }
      toast({ title: "Usuário atualizado" });
      onClose();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl border-white/[0.06] bg-[#0F0F17] text-[#E8E6F0] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[15px]">{user.full_name || user.email}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 rounded-lg bg-[#16161F] p-1 w-fit mb-4">
          {(["info", "edit", "credits"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1 text-[11px] font-medium transition ${tab === t ? "bg-orange-500/15 text-orange-400" : "text-white/50 hover:text-white/80"}`}>
              {t === "info" ? "Detalhes" : t === "edit" ? "Editar" : "Créditos"}
            </button>
          ))}
        </div>

        {tab === "info" && (
          <div className="grid grid-cols-2 gap-3 text-[12px]">
            {[
              ["Email", user.email],
              ["Nome", user.full_name || "—"],
              ["Org", user.org_name || "—"],
              ["Plano", user.plan_tier],
              ["Role", user.role || "—"],
              ["Onboarded", user.onboarded ? "Sim" : "Não"],
              ["Prompts", user.total_prompts ?? 0],
              ["Specs", user.total_specs ?? 0],
              ["Sessões", user.total_sessions ?? 0],
              ["Tokens (mês)", user.tokens_this_month ?? 0],
              ["Assinatura", user.subscription_status || "—"],
              ["Cadastro", user.registered_at ? new Date(user.registered_at).toLocaleDateString("pt-BR") : "—"],
            ].map(([label, value]) => (
              <div key={label as string}>
                <div className="text-white/40 text-[10px] uppercase tracking-wider">{label}</div>
                <div className="text-white/80 mt-0.5" style={mono}>{String(value)}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "edit" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-white/40 mb-1 block">Nome</label>
                <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="h-8 border-white/10 bg-[#16161F] text-[12px]" />
              </div>
              <div>
                <label className="text-[11px] text-white/40 mb-1 block">Plano</label>
                <select value={form.plan_tier} onChange={(e) => setForm((f) => ({ ...f, plan_tier: e.target.value }))}
                  className="h-8 w-full rounded-md border border-white/10 bg-[#16161F] px-2 text-[12px] text-[#E8E6F0]">
                  {["free", "starter", "pro", "enterprise"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-white/40 mb-1 block">Créditos Plano (total)</label>
                <Input type="number" value={form.plan_credits_total} onChange={(e) => setForm((f) => ({ ...f, plan_credits_total: Number(e.target.value) }))} className="h-8 border-white/10 bg-[#16161F] text-[12px]" />
              </div>
              <div>
                <label className="text-[11px] text-white/40 mb-1 block">Créditos Bônus (total)</label>
                <Input type="number" value={form.bonus_credits_total} onChange={(e) => setForm((f) => ({ ...f, bonus_credits_total: Number(e.target.value) }))} className="h-8 border-white/10 bg-[#16161F] text-[12px]" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-[12px] text-white/65">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
              Organização Ativa
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={onClose} className="text-[12px] text-white/50">Cancelar</Button>
              <Button size="sm" onClick={saveChanges} className="bg-orange-500 text-[12px] text-black hover:bg-orange-400">Salvar</Button>
            </div>
          </div>
        )}

        {tab === "credits" && (
          <div className="overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#16161F]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Data", "Origem", "Qtd", "Bônus", "Descrição"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-white/40">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions?.map((t) => (
                  <tr key={t.id} className="border-b border-white/[0.06] last:border-0">
                    <td className="px-4 py-2 text-[11px] text-white/40" style={mono}>{new Date(t.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-2 text-[11px] text-white/65">{t.origin}</td>
                    <td className="px-4 py-2 text-[11px]" style={{ ...mono, color: t.amount > 0 ? "#4ade80" : "#f87171" }}>{t.amount > 0 ? `+${t.amount}` : t.amount}</td>
                    <td className="px-4 py-2 text-[10px] text-white/40">{t.is_bonus ? "Sim" : "Não"}</td>
                    <td className="px-4 py-2 text-[11px] text-white/50 max-w-[200px] truncate">{t.description || "—"}</td>
                  </tr>
                ))}
                {(!transactions || transactions.length === 0) && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-[11px] text-white/30">Nenhuma transação</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
