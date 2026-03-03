import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminProducts, useUpdateProduct, useAdminPrices, useUpdatePrice } from "@/hooks/admin/useAdminData";
import { PlanBadge, SubStatusBadge } from "@/components/admin/Badges";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Pencil, ExternalLink } from "lucide-react";
import "./admin.css";

type TabKey = "products" | "prices" | "subscriptions" | "invoices";

export default function AdminBilling() {
  const [tab, setTab] = useState<TabKey>("products");
  const tabs: { key: TabKey; label: string }[] = [
    { key: "products", label: "Planos" },
    { key: "prices", label: "Preços" },
    { key: "subscriptions", label: "Assinaturas" },
    { key: "invoices", label: "Faturas" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Planos e Billing</h1>
        <div className="adm-tabs">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`adm-tab ${tab === t.key ? "active" : ""}`}>{t.label}</button>
          ))}
        </div>
      </div>
      {tab === "products" && <ProductsTab />}
      {tab === "prices" && <PricesTab />}
      {tab === "subscriptions" && <SubscriptionsTab />}
      {tab === "invoices" && <InvoicesTab />}
    </div>
  );
}

function ProductsTab() {
  const { data: products } = useAdminProducts();
  const updateProduct = useUpdateProduct();
  const { toast } = useToast();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      display_name: p.display_name || "", description: p.description || "", is_active: p.is_active, is_featured: p.is_featured,
      stripe_payment_link: p.stripe_payment_link || "", cta_label: p.cta_label || "", period_label: p.period_label || "",
      trial_label: p.trial_label || "", total_quotas_label: p.total_quotas_label || "", prompts_label: p.prompts_label || "",
      prompts_detail: p.prompts_detail || "", saas_specs_label: p.saas_specs_label || "", saas_specs_detail: p.saas_specs_detail || "",
      misto_label: p.misto_label || "", misto_detail: p.misto_detail || "", build_label: p.build_label || "",
      build_detail: p.build_detail || "", members_label: p.members_label || "", sort_order: p.sort_order ?? 0,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    try { await updateProduct.mutateAsync({ id: editing.id, updates: form }); toast({ title: "Plano atualizado" }); setEditing(null); }
    catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  const toggleActive = async (p: any) => {
    const newActive = !p.is_active;
    try {
      await updateProduct.mutateAsync({ id: p.id, updates: { is_active: newActive } });
      // Cascade: sync all prices for this product
      const { error } = await supabase.from("billing_prices").update({ is_active: newActive }).eq("product_id", p.id);
      if (error) console.error("Failed to cascade price status:", error);
      toast({ title: newActive ? "Ativado" : "Desativado" });
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  const fields = [
    { key: "display_name", label: "Nome exibido" }, { key: "description", label: "Descrição" },
    { key: "stripe_payment_link", label: "Link Stripe" }, { key: "cta_label", label: "CTA Label" },
    { key: "period_label", label: "Período" }, { key: "trial_label", label: "Trial Label" },
    { key: "total_quotas_label", label: "Total Cotas" }, { key: "prompts_label", label: "Prompts Label" },
    { key: "prompts_detail", label: "Prompts Detalhe" }, { key: "saas_specs_label", label: "SaaS Specs Label" },
    { key: "saas_specs_detail", label: "SaaS Specs Detalhe" }, { key: "misto_label", label: "Misto Label" },
    { key: "misto_detail", label: "Misto Detalhe" }, { key: "build_label", label: "Build Label" },
    { key: "build_detail", label: "Build Detalhe" }, { key: "members_label", label: "Membros Label" },
    { key: "sort_order", label: "Ordem", type: "number" },
  ];

  return (
    <>
      <div className="table-card">
        <table>
          <thead><tr>
            {["Plano", "Tier", "Status", "Destaque", "Link Pagamento", "Ordem", "Ações"].map((h) => <th key={h}>{h}</th>)}
          </tr></thead>
          <tbody>
            {products?.map((p) => (
              <tr key={p.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{p.display_name || p.name}</div>
                  <div style={{ fontSize: 10, fontFamily: "var(--adm-mono)", color: "var(--adm-text-soft)" }}>{p.id}</div>
                </td>
                <td><PlanBadge tier={p.plan_tier} /></td>
                <td>
                  <button onClick={() => toggleActive(p)} className={`adm-badge ${p.is_active ? "active" : "inactive"}`} style={{ cursor: "pointer" }}>
                    {p.is_active ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td>{p.is_featured ? "⭐" : "—"}</td>
                <td>
                  {(p as any).stripe_payment_link ? (
                    <a href={(p as any).stripe_payment_link} target="_blank" rel="noopener noreferrer" style={{ color: "var(--adm-accent)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                      <ExternalLink size={12} /> Link
                    </a>
                  ) : <span style={{ color: "var(--adm-text-soft)" }}>—</span>}
                </td>
                <td style={{ fontFamily: "var(--adm-mono)" }}>{p.sort_order}</td>
                <td><button className="adm-btn ghost" onClick={() => openEdit(p)}><Pencil size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="border-[var(--adm-border)] bg-[var(--adm-surface)] text-[var(--adm-text)] max-w-[660px] rounded-[18px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle style={{ fontSize: 16, fontWeight: 800 }}>Editar Plano — {editing?.display_name || editing?.name}</DialogTitle></DialogHeader>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
            {fields.map(({ key, label, type }) => (
              <div key={key}>
                <label className="adm-label">{label}</label>
                <input className="adm-input mono" value={form[key] ?? ""} onChange={(e) => setForm((f) => ({ ...f, [key]: type === "number" ? Number(e.target.value) : e.target.value }))} type={type || "text"} />
              </div>
            ))}
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} /> Ativo
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <input type="checkbox" checked={form.is_featured ?? false} onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))} /> Destaque
              </label>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <button className="adm-btn outline" onClick={() => setEditing(null)}>Cancelar</button>
            <button className="adm-btn primary" onClick={saveEdit}>Salvar</button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PricesTab() {
  const { data: prices } = useAdminPrices();
  const updatePrice = useUpdatePrice();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");

  const savePrice = async (id: string) => {
    try { await updatePrice.mutateAsync({ id, updates: { unit_amount: Math.round(Number(editAmount) * 100) } }); toast({ title: "Preço atualizado" }); setEditingId(null); }
    catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  return (
    <div className="table-card">
      <table>
        <thead><tr>
          {["Produto", "Preço ID", "Valor", "Moeda", "Intervalo", "Status", "Ações"].map((h) => <th key={h}>{h}</th>)}
        </tr></thead>
        <tbody>
          {prices?.map((p: any) => (
            <tr key={p.id}>
              <td style={{ fontWeight: 600 }}>{p.product_name || p.product_id}</td>
              <td style={{ fontSize: 10, fontFamily: "var(--adm-mono)", color: "var(--adm-text-soft)" }}>{p.id}</td>
              <td>
                {editingId === p.id ? (
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <input className="adm-input mono" style={{ width: 100, height: 30 }} value={editAmount} onChange={(e) => setEditAmount(e.target.value)} autoFocus />
                    <button className="adm-btn primary" style={{ padding: "4px 10px" }} onClick={() => savePrice(p.id)}>✓</button>
                    <button className="adm-btn ghost" onClick={() => setEditingId(null)}>✕</button>
                  </div>
                ) : (
                  <span style={{ fontFamily: "var(--adm-mono)", cursor: "pointer" }} onClick={() => { setEditingId(p.id); setEditAmount(((p.unit_amount || 0) / 100).toString()); }}>
                    R${((p.unit_amount || 0) / 100).toFixed(2)}
                  </span>
                )}
              </td>
              <td style={{ fontFamily: "var(--adm-mono)", color: "var(--adm-text-soft)" }}>{p.currency}</td>
              <td>{p.recurring_interval || "—"}</td>
              <td>
                <span className={`adm-badge ${p.product_is_active ? "active" : "inactive"}`} title="Status herdado do plano">
                  {p.product_is_active ? "Ativo" : "Inativo"}
                </span>
              </td>
              <td><button className="adm-btn ghost" onClick={() => { setEditingId(p.id); setEditAmount(((p.unit_amount || 0) / 100).toString()); }}><Pencil size={14} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubscriptionsTab() {
  const { data: subs } = useQuery({
    queryKey: ["admin-billing-overview"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_billing_overview").select("*").order("current_period_end", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="table-card">
      <table>
        <thead><tr>
          {["Org", "Plano", "Status", "Valor", "Período", "Stripe ID"].map((h) => <th key={h}>{h}</th>)}
        </tr></thead>
        <tbody>
          {subs?.map((s) => (
            <tr key={s.subscription_id}>
              <td style={{ fontWeight: 600 }}>{s.org_name || "—"}</td>
              <td><PlanBadge tier={s.plan_tier} /></td>
              <td><SubStatusBadge status={s.status || "—"} /></td>
              <td style={{ fontFamily: "var(--adm-mono)" }}>{s.unit_amount ? `R$${(s.unit_amount / 100).toFixed(2)}` : "—"}/{s.recurring_interval || "—"}</td>
              <td style={{ fontFamily: "var(--adm-mono)", fontSize: 11, color: "var(--adm-text-soft)" }}>{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString("pt-BR") : "—"}</td>
              <td style={{ fontFamily: "var(--adm-mono)", fontSize: 10, color: "var(--adm-text-soft)" }}>{s.subscription_id?.slice(0, 20) || "—"}</td>
            </tr>
          ))}
          {(!subs || subs.length === 0) && <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--adm-text-soft)" }}>Nenhuma assinatura</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function InvoicesTab() {
  const { data: invoices } = useQuery({
    queryKey: ["admin-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("billing_invoices").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="table-card">
      <table>
        <thead><tr>
          {["ID", "Status", "Valor", "Pago em", "PDF"].map((h) => <th key={h}>{h}</th>)}
        </tr></thead>
        <tbody>
          {invoices?.map((inv) => (
            <tr key={inv.id}>
              <td style={{ fontFamily: "var(--adm-mono)", fontSize: 11, color: "var(--adm-text-soft)" }}>{inv.id.slice(0, 20)}</td>
              <td><SubStatusBadge status={inv.status === "paid" ? "active" : inv.status} /></td>
              <td style={{ fontFamily: "var(--adm-mono)" }}>R${(inv.amount_due / 100).toFixed(2)}</td>
              <td style={{ fontFamily: "var(--adm-mono)", fontSize: 11, color: "var(--adm-text-soft)" }}>{inv.paid_at ? new Date(inv.paid_at).toLocaleDateString("pt-BR") : "—"}</td>
              <td>{inv.invoice_pdf && <a href={inv.invoice_pdf} target="_blank" rel="noopener noreferrer" style={{ color: "var(--adm-accent)", fontSize: 12 }}>Download</a>}</td>
            </tr>
          ))}
          {(!invoices || invoices.length === 0) && <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--adm-text-soft)" }}>Nenhuma fatura</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
