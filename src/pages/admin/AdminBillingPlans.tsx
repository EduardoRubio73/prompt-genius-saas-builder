import { useMemo, useState, type ReactNode } from "react";
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
});

export default function AdminBillingPlans() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PlanRow | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm());

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
    // Fetch metadata from billing_products and billing_prices
    const [prodRes, priceRes] = await Promise.all([
      supabase.from("billing_products").select("is_featured, metadata").eq("id", row.product_id).single(),
      row.price_id
        ? supabase.from("billing_prices").select("trial_period_days, metadata").eq("id", row.price_id).single()
        : Promise.resolve({ data: null }),
    ]);
    const prodMeta = (prodRes.data?.metadata as any) || {};
    const priceMeta = (priceRes.data?.metadata as any) || {};
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
      credits_limit: prodMeta.credits_limit ?? priceMeta.credits_limit ?? 0,
      members_limit: prodMeta.members_limit ?? priceMeta.members_limit ?? 1,
      is_active: row.product_active ?? true,
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
          <thead><tr>{["Nome", "Preço", "Intervalo", "Tier", "Status", "Stripe Product", "Stripe Price", "Ações"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={`${p.product_id}-${p.price_id ?? "no-price"}`}>
                <td style={{ fontWeight: 600 }}>{p.display_name || p.name || "—"}</td>
                <td>R$ {((p.unit_amount ?? 0) / 100).toFixed(2)}</td>
                <td>{p.recurring_interval || "—"}</td>
                <td>{p.plan_tier || "—"}</td>
                <td>
                  {p.product_active === false
                    ? <span className="adm-badge inactive">Inativo</span>
                    : <span className="adm-badge active">Ativo</span>}
                </td>
                <td style={{ fontSize: 11, fontFamily: "var(--adm-mono)" }}>{p.product_id || "—"}</td>
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
            <Field label="Preço (BRL)"><input className="adm-input" type="number" value={form.unit_amount_brl} onChange={(e) => setForm((f) => ({ ...f, unit_amount_brl: e.target.value }))} /></Field>
            <Field label="Intervalo"><select className="adm-input" value={form.recurring_interval} onChange={(e) => setForm((f) => ({ ...f, recurring_interval: e.target.value as any }))}><option value="day">day</option><option value="month">month</option><option value="year">year</option></select></Field>
            <Field label="Ordem"><input className="adm-input" type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} /></Field>
            <Field label="Trial days"><input className="adm-input" type="number" value={form.trial_days} onChange={(e) => setForm((f) => ({ ...f, trial_days: Number(e.target.value) }))} /></Field>
            <Field label="Limite de créditos"><input className="adm-input" type="number" value={form.credits_limit} onChange={(e) => setForm((f) => ({ ...f, credits_limit: Number(e.target.value) }))} /></Field>
            <Field label="Limite de membros"><input className="adm-input" type="number" value={form.members_limit} onChange={(e) => setForm((f) => ({ ...f, members_limit: Number(e.target.value) }))} /></Field>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <label><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))} /> Destaque</label>
              <label><input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} /> Ativo</label>
            </div>
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
