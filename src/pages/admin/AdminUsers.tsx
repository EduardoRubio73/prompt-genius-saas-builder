import { useState, useEffect } from "react";
import { useAdminUsers, useUpdateProfile, useUpdateOrganization, useAdminCreditTransactions } from "@/hooks/admin/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { PlanBadge, StatusBadge } from "@/components/admin/Badges";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import "./admin.css";

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
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Usuários e Organizações</h1>
        <div className="filter-input" style={{ width: 280 }}>
          <Search size={14} />
          <input placeholder="Buscar por nome ou email..." value={search} onChange={(e) => handleSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead><tr>
            {["Usuário", "Plano", "Org", "Prompts", "Specs", "Cadastro", "Status"].map((h) => <th key={h}>{h}</th>)}
          </tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px 16px", color: "var(--adm-text-soft)" }}>Carregando...</td></tr>}
            {users?.map((u) => (
              <tr key={u.user_id} className="clickable" onClick={() => setSelectedUser(u)}>
                <td>
                  <div style={{ fontWeight: 600 }}>{u.full_name || "—"}</div>
                  <div style={{ fontSize: 11, fontFamily: "var(--adm-mono)", color: "var(--adm-text-soft)" }}>{u.email}</div>
                </td>
                <td><PlanBadge tier={u.plan_tier} /></td>
                <td style={{ color: "var(--adm-text-soft)" }}>{u.org_name || "—"}</td>
                <td style={{ fontFamily: "var(--adm-mono)", fontSize: 12 }}>{u.total_prompts ?? 0}</td>
                <td style={{ fontFamily: "var(--adm-mono)", fontSize: 12 }}>{u.total_specs ?? 0}</td>
                <td style={{ fontFamily: "var(--adm-mono)", fontSize: 11, color: "var(--adm-text-soft)" }}>{u.registered_at ? new Date(u.registered_at).toLocaleDateString("pt-BR") : "—"}</td>
                <td><StatusBadge active={u.org_active !== false} labelTrue="ativo" labelFalse="inativo" /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pag">
          <span className="pag-info">Página {page + 1} · {users?.length ?? 0} registros</span>
          <div className="pag-btns">
            <button className="pag-btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={14} /></button>
            <button className="pag-btn" disabled={!users || users.length < perPage} onClick={() => setPage((p) => p + 1)}><ChevronRight size={14} /></button>
          </div>
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
    is_active: user.org_active !== false,
    plan_credits_total: 0,
    bonus_credits_total: 0,
  });

  useEffect(() => {
    if (user.org_id) {
      supabase.from("organizations").select("plan_credits_total, bonus_credits_total").eq("id", user.org_id).single()
        .then(({ data }) => {
          if (data) {
            setForm(f => ({ ...f, plan_credits_total: data.plan_credits_total, bonus_credits_total: data.bonus_credits_total }));
          }
        });
    }
  }, [user.org_id]);

  const saveChanges = async () => {
    try {
      if (user.user_id) await updateProfile.mutateAsync({ id: user.user_id, updates: { full_name: form.full_name } });
      if (user.org_id) await updateOrg.mutateAsync({ id: user.org_id, updates: { plan_tier: form.plan_tier, is_active: form.is_active, plan_credits_total: form.plan_credits_total, bonus_credits_total: form.bonus_credits_total } });
      toast({ title: "Usuário atualizado" });
      onClose();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const infoFields = [
    ["Email", user.email], ["Nome", user.full_name || "—"], ["Org", user.org_name || "—"],
    ["Plano", user.plan_tier], ["Role", user.role || "—"], ["Onboarded", user.onboarded ? "Sim" : "Não"],
    ["Prompts", user.total_prompts ?? 0], ["Specs", user.total_specs ?? 0], ["Sessões", user.total_sessions ?? 0],
    ["Tokens (mês)", user.tokens_this_month ?? 0], ["Assinatura", user.subscription_status || "—"],
    ["Cadastro", user.registered_at ? new Date(user.registered_at).toLocaleDateString("pt-BR") : "—"],
  ];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-[var(--adm-border)] bg-[var(--adm-surface)] text-[var(--adm-text)] max-w-[660px] rounded-[18px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ fontSize: 16, fontWeight: 800 }}>{user.full_name || user.email}</DialogTitle>
        </DialogHeader>

        <div className="adm-tabs" style={{ marginBottom: 16 }}>
          {(["info", "edit", "credits"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`adm-tab ${tab === t ? "active" : ""}`}>
              {t === "info" ? "Detalhes" : t === "edit" ? "Editar" : "Créditos"}
            </button>
          ))}
        </div>

        {tab === "info" && (
          <div className="meta-grid">
            {infoFields.map(([label, value]) => (
              <div key={label as string}>
                <div className="meta-lbl">{label}</div>
                <div className="meta-val">{String(value)}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "edit" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label className="adm-label">Nome</label><input className="adm-input" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} /></div>
              <div>
                <label className="adm-label">Plano</label>
                <select className="adm-input" value={form.plan_tier} onChange={(e) => setForm((f) => ({ ...f, plan_tier: e.target.value }))}>
                  {["free", "starter", "pro", "enterprise"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="adm-label">Créditos Plano</label><input className="adm-input mono" type="number" value={form.plan_credits_total} onChange={(e) => setForm((f) => ({ ...f, plan_credits_total: Number(e.target.value) }))} /></div>
              <div><label className="adm-label">Créditos Bônus</label><input className="adm-input mono" type="number" value={form.bonus_credits_total} onChange={(e) => setForm((f) => ({ ...f, bonus_credits_total: Number(e.target.value) }))} /></div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
              Organização Ativa
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="adm-btn outline" onClick={onClose}>Cancelar</button>
              <button className="adm-btn primary" onClick={saveChanges}>Salvar</button>
            </div>
          </div>
        )}

        {tab === "credits" && (
          <div className="table-card">
            <table>
              <thead><tr>
                {["Data", "Origem", "Qtd", "Bônus", "Descrição"].map((h) => <th key={h}>{h}</th>)}
              </tr></thead>
              <tbody>
                {transactions?.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontFamily: "var(--adm-mono)", fontSize: 11 }}>{new Date(t.created_at).toLocaleDateString("pt-BR")}</td>
                    <td>{t.origin}</td>
                    <td style={{ fontFamily: "var(--adm-mono)", color: t.amount > 0 ? "var(--adm-green)" : "var(--adm-red)" }}>{t.amount > 0 ? `+${t.amount}` : t.amount}</td>
                    <td style={{ fontSize: 11 }}>{t.is_bonus ? "Sim" : "Não"}</td>
                    <td style={{ fontSize: 11, color: "var(--adm-text-soft)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description || "—"}</td>
                  </tr>
                ))}
                {(!transactions || transactions.length === 0) && (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: "24px 16px", color: "var(--adm-text-soft)" }}>Nenhuma transação</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
