import { useMemo, useState, useEffect, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pencil, RefreshCw, Plus, Loader2 } from "lucide-react";
import "./admin.css";

type PlanRow = {
  product_id: string;
  name: string | null;
  display_name: string | null;
  plan_tier: string | null;
  price_id: string | null;
  stripe_price_id: string | null;
  unit_amount: number | null;
  recurring_interval: string | null;
  sort_order: number | null;
  product_active: boolean | null;
  price_active: boolean | null;
  credits_limit: number | null;
  credit_unit_cost: number | null;
};

type PlanForm = {
  product_id?: string;
  name: string;
  display_name: string;
  plan_tier: "free" | "starter" | "pro" | "enterprise";
  unit_amount_brl: string;
  recurring_interval: "day" | "month" | "year";
  sort_order: number;
  is_featured: boolean;
  trial_days: number;
  credits_limit: number;
  members_limit: number;
  is_active: boolean;
  credit_unit_cost: number;
  prompt_cost: number;
  saas_specs_cost: number;
  modo_misto_cost: number;
  build_engine_cost: number;
};

const emptyForm = (): PlanForm => ({
  name: "",
  display_name: "",
  plan_tier: "starter",
  unit_amount_brl: "",
  recurring_interval: "month",
  sort_order: 0,
  is_featured: false,
  trial_days: 0,
  credits_limit: 0,
  members_limit: 1,
  is_active: true,
  credit_unit_cost: 0.87,
  prompt_cost: 1,
  saas_specs_cost: 2,
  modo_misto_cost: 2,
  build_engine_cost: 5,
});

export default function AdminBillingPlans() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PlanRow | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm());

  // Auto-calc credits_limit when price or credit_unit_cost changes
  useEffect(() => {
    const price = Number(form.unit_amount_brl);
    const cost = form.credit_unit_cost;
    if (price > 0 && cost > 0) {
      setForm((f) => ({ ...f, credits_limit: Math.floor(price / cost) }));
    }
  }, [form.unit_amount_brl, form.credit_unit_cost]);

  const { data: plans, isLoading } = useQuery({
    queryKey: ["admin-stripe-plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("v_active_stripe_plans").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as PlanRow[];
    },
  });

  const createPlan = useMutation({
    mutationFn: async (payload: PlanForm) => {
      const { error } = await supabase.functions.invoke("create-billing-plan", {
        body: {
          name: payload.name,
          display_name: payload.display_name,
          plan_tier: payload.plan_tier,
          unit_amount: Math.round(Number(payload.unit_amount_brl) * 100),
          recurring_interval: payload.recurring_interval,
          sort_order: payload.sort_order,
          is_featured: payload.is_featured,
          trial_days: payload.trial_days,
          credits_limit: payload.credits_limit,
          members_limit: payload.members_limit,
          is_active: payload.is_active,
          credit_unit_cost: payload.credit_unit_cost,
          prompt_cost: payload.prompt_cost,
          saas_specs_cost: payload.saas_specs_cost,
          modo_misto_cost: payload.modo_misto_cost,
          build_engine_cost: payload.build_engine_cost,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-stripe-plans"] }),
  });

  const updatePlan = useMutation({
    mutationFn: async (payload: PlanForm) => {
      const { error } = await supabase.functions.invoke("update-billing-plan", {
        body: {
          product_id: payload.product_id,
          name: payload.name,
          display_name: payload.display_name,
          plan_tier: payload.plan_tier,
          unit_amount: Math.round(Number(payload.unit_amount_brl) * 100),
          recurring_interval: payload.recurring_interval,
          sort_order: payload.sort_order,
          is_featured: payload.is_featured,
          trial_days: payload.trial_days,
          credits_limit: payload.credits_limit,
          members_limit: payload.members_limit,
          is_active: payload.is_active,
          credit_unit_cost: payload.credit_unit_cost,
          prompt_cost: payload.prompt_cost,
          saas_specs_cost: payload.saas_specs_cost,
          modo_misto_cost: payload.modo_misto_cost,
          build_engine_cost: payload.build_engine_cost,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-stripe-plans"] }),
  });

  const syncStripe = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("stripe-sync-products", { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-stripe-plans"] });
      const s = data?.summary;
      toast({
        title: "✅ Stripe sincronizado",
        description: s
          ? `Produtos: ${s.products_created} criados, ${s.products_updated} atualizados, ${s.products_recreated || 0} recriados. Preços: ${s.prices_created} criados, ${s.prices_recreated || 0} recriados.`
          : "Sincronização concluída com sucesso.",
      });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao sincronizar Stripe", description: err.message, variant: "destructive" });
    },
  });

  const openNew = () => { setEditing(null); setForm(emptyForm()); setOpen(true); };
  const openEdit = async (row: PlanRow) => {
    setEditing(row);
    const [prodRes, priceRes] = await Promise.all([
      supabase.from("billing_products").select("is_featured, metadata, credit_unit_cost, credit_costs").eq("id", row.product_id).single(),
      row.price_id
        ? supabase.from("billing_prices").select("trial_period_days, metadata").eq("id", row.price_id).single()
        : Promise.resolve({ data: null }),
    ]);
    const prodMeta = (prodRes.data?.metadata as any) || {};
    const priceMeta = (priceRes.data?.metadata as any) || {};
    const creditCosts = (prodRes.data as any)?.credit_costs || {};
    const trialDays = (priceRes.data as any)?.trial_period_days ?? priceMeta.trial_days ?? prodMeta.trial_days ?? 0;

    setForm({
      product_id: row.product_id,
      name: row.name || "",
      display_name: row.display_name || "",
      plan_tier: (row.plan_tier as PlanForm["plan_tier"]) || "starter",
      unit_amount_brl: row.unit_amount != null ? (row.unit_amount / 100).toString() : "",
      recurring_interval: (row.recurring_interval as "day" | "month" | "year") || "month",
      sort_order: row.sort_order ?? 0,
      is_featured: prodRes.data?.is_featured ?? false,
      trial_days: trialDays,
      credits_limit: row.credits_limit ?? prodMeta.credits_limit ?? 0,
      members_limit: prodMeta.members_limit ?? 1,
      is_active: row.product_active ?? true,
      credit_unit_cost: (prodRes.data as any)?.credit_unit_cost ?? prodMeta.credit_unit_cost ?? 0.87,
      prompt_cost: creditCosts.prompt_cost ?? prodMeta.prompt_cost ?? 1,
      saas_specs_cost: creditCosts.saas_specs_cost ?? prodMeta.saas_specs_cost ?? 2,
      modo_misto_cost: creditCosts.modo_misto_cost ?? prodMeta.modo_misto_cost ?? 2,
      build_engine_cost: creditCosts.build_engine_cost ?? prodMeta.build_engine_cost ?? 5,
    });
    setOpen(true);
  };

  const onSubmit = async () => {
    try {
      if (editing) await updatePlan.mutateAsync(form);
      else await createPlan.mutateAsync(form);
      toast({ title: editing ? "Plano atualizado" : "Plano criado" });
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const loading = createPlan.isPending || updatePlan.isPending;
  const rows = useMemo(() => plans ?? [], [plans]);

  // Derived limits preview
  const promptLimit = form.prompt_cost > 0 ? Math.floor(form.credits_limit / form.prompt_cost) : 0;
  const saasLimit = form.saas_specs_cost > 0 ? Math.floor(form.credits_limit / form.saas_specs_cost) : 0;
  const mistoLimit = form.modo_misto_cost > 0 ? Math.floor(form.credits_limit / form.modo_misto_cost) : 0;
  const buildLimit = form.build_engine_cost > 0 ? Math.floor(form.credits_limit / form.build_engine_cost) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Planos (Stripe Sync)</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="adm-btn outline" disabled={syncStripe.isPending} onClick={() => syncStripe.mutate()}>
            {syncStripe.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {syncStripe.isPending ? "Sincronizando…" : "Conferir Stripe"}
          </button>
          <button className="adm-btn primary" onClick={openNew}><Plus size={14} /> Criar novo plano</button>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead><tr>{["Nome", "Preço", "Cotas", "Intervalo", "Tier", "Status", "Stripe Price", "Ações"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={`${p.product_id}-${p.price_id ?? "no-price"}`}>
                <td style={{ fontWeight: 600 }}>{p.display_name || p.name || "—"}</td>
                <td>R$ {((p.unit_amount ?? 0) / 100).toFixed(2)}</td>
                <td>{p.credits_limit ?? 0}</td>
                <td>{p.recurring_interval || "—"}</td>
                <td>{p.plan_tier || "—"}</td>
                <td>
                  {p.product_active === false
                    ? <span className="adm-badge inactive">Inativo</span>
                    : <span className="adm-badge active">Ativo</span>}
                </td>
                <td style={{ fontSize: 11, fontFamily: "var(--adm-mono)" }}>{p.stripe_price_id || "—"}</td>
                <td><button className="adm-btn ghost" onClick={() => openEdit(p)}><Pencil size={14} /></button></td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", padding: 30, color: "var(--adm-text-soft)" }}>Nenhum plano encontrado</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-[var(--adm-border)] bg-[var(--adm-surface)] text-[var(--adm-text)] max-w-[720px] rounded-[18px]">
          <DialogHeader><DialogTitle>{editing ? "Editar plano" : "Novo plano"}</DialogTitle></DialogHeader>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Nome"><input className="adm-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
            <Field label="Display name"><input className="adm-input" value={form.display_name} onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))} /></Field>
            <Field label="Plan tier"><select className="adm-input" value={form.plan_tier} onChange={(e) => setForm((f) => ({ ...f, plan_tier: e.target.value as any }))}><option value="free">free</option><option value="starter">starter</option><option value="pro">pro</option><option value="enterprise">enterprise</option></select></Field>
            <Field label="Preço (BRL)"><input className="adm-input" type="number" step="0.01" value={form.unit_amount_brl} onChange={(e) => setForm((f) => ({ ...f, unit_amount_brl: e.target.value }))} /></Field>
            <Field label="Custo por Cota (R$)"><input className="adm-input" type="number" step="0.01" value={form.credit_unit_cost} onChange={(e) => setForm((f) => ({ ...f, credit_unit_cost: Number(e.target.value) }))} /></Field>
            <Field label="Limite de créditos (auto)">
              <input className="adm-input" type="number" value={form.credits_limit} readOnly style={{ opacity: 0.7, cursor: "not-allowed" }} />
            </Field>
            <Field label="Intervalo"><select className="adm-input" value={form.recurring_interval} onChange={(e) => setForm((f) => ({ ...f, recurring_interval: e.target.value as any }))}><option value="day">day</option><option value="month">month</option><option value="year">year</option></select></Field>
            <Field label="Ordem"><input className="adm-input" type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} /></Field>
            <Field label="Trial days"><input className="adm-input" type="number" value={form.trial_days} onChange={(e) => setForm((f) => ({ ...f, trial_days: Number(e.target.value) }))} /></Field>
            <Field label="Limite de membros"><input className="adm-input" type="number" value={form.members_limit} onChange={(e) => setForm((f) => ({ ...f, members_limit: Number(e.target.value) }))} /></Field>
          </div>

          {/* Action costs */}
          <div style={{ marginTop: 8 }}>
            <label className="adm-label" style={{ marginBottom: 8, display: "block" }}>Custo por ação (cotas)</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
              <Field label="Prompt"><input className="adm-input" type="number" value={form.prompt_cost} onChange={(e) => setForm((f) => ({ ...f, prompt_cost: Number(e.target.value) }))} /></Field>
              <Field label="SaaS Spec"><input className="adm-input" type="number" value={form.saas_specs_cost} onChange={(e) => setForm((f) => ({ ...f, saas_specs_cost: Number(e.target.value) }))} /></Field>
              <Field label="Modo Misto"><input className="adm-input" type="number" value={form.modo_misto_cost} onChange={(e) => setForm((f) => ({ ...f, modo_misto_cost: Number(e.target.value) }))} /></Field>
              <Field label="BUILD Engine"><input className="adm-input" type="number" value={form.build_engine_cost} onChange={(e) => setForm((f) => ({ ...f, build_engine_cost: Number(e.target.value) }))} /></Field>
            </div>
          </div>

          {/* Derived limits preview */}
          <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 10, background: "var(--adm-bg)", border: "1px solid var(--adm-border)", fontSize: 12, color: "var(--adm-text-soft)" }}>
            <strong style={{ color: "var(--adm-text)", fontSize: 12 }}>Limites calculados:</strong>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 6, marginTop: 6 }}>
              <span>✨ Prompts: <strong style={{ color: "var(--adm-text)" }}>{promptLimit}</strong></span>
              <span>🏗️ SaaS: <strong style={{ color: "var(--adm-text)" }}>{saasLimit}</strong></span>
              <span>⚡ Misto: <strong style={{ color: "var(--adm-text)" }}>{mistoLimit}</strong></span>
              <span>⚙️ BUILD: <strong style={{ color: "var(--adm-text)" }}>{buildLimit}</strong></span>
              <span>📦 Total: <strong style={{ color: "var(--adm-text)" }}>{form.credits_limit}</strong></span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 4 }}>
            <label><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))} /> Destaque</label>
            <label><input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} /> Ativo</label>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button className="adm-btn outline" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="adm-btn primary" disabled={loading} onClick={onSubmit}>Salvar</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><label className="adm-label">{label}</label>{children}</div>;
}
