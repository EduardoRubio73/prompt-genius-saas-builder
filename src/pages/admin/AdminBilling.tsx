import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminProducts, useUpdateProduct, useAdminPrices, useUpdatePrice } from "@/hooks/admin/useAdminData";
import { PlanBadge, SubStatusBadge } from "@/components/admin/Badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Pencil, ExternalLink } from "lucide-react";

const mono = { fontFamily: "'IBM Plex Mono', monospace" };

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
    <div className="space-y-5 animate-in fade-in">
      <h2 className="text-lg font-semibold">Planos e Billing</h2>
      <div className="flex gap-1 rounded-lg bg-[#16161F] p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-4 py-1.5 text-[12px] font-medium transition ${
              tab === t.key ? "bg-orange-500/15 text-orange-400" : "text-white/50 hover:text-white/80"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "products" && <ProductsTab />}
      {tab === "prices" && <PricesTab />}
      {tab === "subscriptions" && <SubscriptionsTab />}
      {tab === "invoices" && <InvoicesTab />}
    </div>
  );
}

/* ─── Products Tab ─── */
function ProductsTab() {
  const { data: products } = useAdminProducts();
  const updateProduct = useUpdateProduct();
  const { toast } = useToast();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      display_name: p.display_name || "",
      description: p.description || "",
      is_active: p.is_active,
      is_featured: p.is_featured,
      stripe_payment_link: p.stripe_payment_link || "",
      cta_label: p.cta_label || "",
      period_label: p.period_label || "",
      trial_label: p.trial_label || "",
      total_quotas_label: p.total_quotas_label || "",
      prompts_label: p.prompts_label || "",
      prompts_detail: p.prompts_detail || "",
      saas_specs_label: p.saas_specs_label || "",
      saas_specs_detail: p.saas_specs_detail || "",
      misto_label: p.misto_label || "",
      misto_detail: p.misto_detail || "",
      build_label: p.build_label || "",
      build_detail: p.build_detail || "",
      members_label: p.members_label || "",
      sort_order: p.sort_order ?? 0,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await updateProduct.mutateAsync({ id: editing.id, updates: form });
      toast({ title: "Plano atualizado" });
      setEditing(null);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const toggleActive = async (p: any) => {
    try {
      await updateProduct.mutateAsync({ id: p.id, updates: { is_active: !p.is_active } });
      toast({ title: p.is_active ? "Plano desativado" : "Plano ativado" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0F0F17]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["Plano", "Tier", "Status", "Destaque", "Link Pagamento", "Ordem", "Ações"].map((h) => (
                <th key={h} className="px-5 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-white/40">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products?.map((p) => (
              <tr key={p.id} className="border-b border-white/[0.06] last:border-0 hover:bg-[#16161F] transition">
                <td className="px-5 py-3">
                  <div className="text-[13px] font-medium">{p.display_name || p.name}</div>
                  <div className="text-[10px] text-white/40" style={mono}>{p.id}</div>
                </td>
                <td className="px-5 py-3"><PlanBadge tier={p.plan_tier} /></td>
                <td className="px-5 py-3">
                  <button onClick={() => toggleActive(p)} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${p.is_active ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                    {p.is_active ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td className="px-5 py-3 text-[12px] text-white/65">{p.is_featured ? "⭐" : "—"}</td>
                <td className="px-5 py-3">
                  {(p as any).stripe_payment_link ? (
                    <a href={(p as any).stripe_payment_link} target="_blank" rel="noopener noreferrer" className="text-[11px] text-orange-400 hover:underline flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Link
                    </a>
                  ) : <span className="text-[11px] text-white/30">—</span>}
                </td>
                <td className="px-5 py-3 text-[12px] text-white/40" style={mono}>{p.sort_order}</td>
                <td className="px-5 py-3">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)} className="h-7 w-7 p-0 text-white/40 hover:text-orange-400">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl border-white/[0.06] bg-[#0F0F17] text-[#E8E6F0] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Editar Plano — {editing?.display_name || editing?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { key: "display_name", label: "Nome exibido" },
              { key: "description", label: "Descrição" },
              { key: "stripe_payment_link", label: "Link Stripe" },
              { key: "cta_label", label: "CTA Label" },
              { key: "period_label", label: "Período" },
              { key: "trial_label", label: "Trial Label" },
              { key: "total_quotas_label", label: "Total Cotas" },
              { key: "prompts_label", label: "Prompts Label" },
              { key: "prompts_detail", label: "Prompts Detalhe" },
              { key: "saas_specs_label", label: "SaaS Specs Label" },
              { key: "saas_specs_detail", label: "SaaS Specs Detalhe" },
              { key: "misto_label", label: "Misto Label" },
              { key: "misto_detail", label: "Misto Detalhe" },
              { key: "build_label", label: "Build Label" },
              { key: "build_detail", label: "Build Detalhe" },
              { key: "members_label", label: "Membros Label" },
              { key: "sort_order", label: "Ordem", type: "number" },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="text-[11px] text-white/40 mb-1 block">{label}</label>
                <Input
                  value={form[key] ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
                  className="h-8 border-white/10 bg-[#16161F] text-[12px] text-[#E8E6F0]"
                  type={type || "text"}
                  style={mono}
                />
              </div>
            ))}
            <div className="flex items-center gap-4 col-span-2">
              <label className="flex items-center gap-2 text-[12px] text-white/65">
                <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
                Ativo
              </label>
              <label className="flex items-center gap-2 text-[12px] text-white/65">
                <input type="checkbox" checked={form.is_featured ?? false} onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))} />
                Destaque
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)} className="text-[12px] text-white/50">Cancelar</Button>
            <Button size="sm" onClick={saveEdit} className="bg-orange-500 text-[12px] text-black hover:bg-orange-400">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─── Prices Tab ─── */
function PricesTab() {
  const { data: prices } = useAdminPrices();
  const updatePrice = useUpdatePrice();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");

  const savePrice = async (id: string) => {
    try {
      await updatePrice.mutateAsync({ id, updates: { unit_amount: Math.round(Number(editAmount) * 100) } });
      toast({ title: "Preço atualizado" });
      setEditingId(null);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const togglePriceActive = async (p: any) => {
    try {
      await updatePrice.mutateAsync({ id: p.id, updates: { is_active: !p.is_active } });
      toast({ title: "Status atualizado" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0F0F17]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {["Produto", "Preço ID", "Valor", "Moeda", "Intervalo", "Status", "Ações"].map((h) => (
              <th key={h} className="px-5 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-white/40">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {prices?.map((p) => (
            <tr key={p.id} className="border-b border-white/[0.06] last:border-0 hover:bg-[#16161F] transition">
              <td className="px-5 py-3 text-[12px] font-medium">{(p as any).product_name || p.product_id}</td>
              <td className="px-5 py-3 text-[10px] text-white/40" style={mono}>{p.id}</td>
              <td className="px-5 py-3">
                {editingId === p.id ? (
                  <div className="flex items-center gap-1">
                    <Input value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="h-7 w-24 border-white/10 bg-[#16161F] text-[12px]" style={mono} autoFocus />
                    <Button size="sm" onClick={() => savePrice(p.id)} className="h-7 bg-orange-500 text-[11px] text-black">✓</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 text-[11px]">✕</Button>
                  </div>
                ) : (
                  <span className="text-[12px] cursor-pointer hover:text-orange-400" style={mono} onClick={() => { setEditingId(p.id); setEditAmount(((p.unit_amount || 0) / 100).toString()); }}>
                    R${((p.unit_amount || 0) / 100).toFixed(2)}
                  </span>
                )}
              </td>
              <td className="px-5 py-3 text-[12px] text-white/40" style={mono}>{p.currency}</td>
              <td className="px-5 py-3 text-[12px] text-white/65">{p.recurring_interval || "—"}</td>
              <td className="px-5 py-3">
                <button onClick={() => togglePriceActive(p)} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${p.is_active ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                  {p.is_active ? "Ativo" : "Inativo"}
                </button>
              </td>
              <td className="px-5 py-3">
                <Button variant="ghost" size="sm" onClick={() => { setEditingId(p.id); setEditAmount(((p.unit_amount || 0) / 100).toString()); }} className="h-7 w-7 p-0 text-white/40 hover:text-orange-400">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Subscriptions Tab ─── */
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
    <div className="overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0F0F17]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {["Org", "Plano", "Status", "Valor", "Período", "Stripe ID"].map((h) => (
              <th key={h} className="px-5 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-white/40">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subs?.map((s) => (
            <tr key={s.subscription_id} className="border-b border-white/[0.06] last:border-0 hover:bg-[#16161F] transition">
              <td className="px-5 py-3 text-[13px] font-medium">{s.org_name || "—"}</td>
              <td className="px-5 py-3"><PlanBadge tier={s.plan_tier} /></td>
              <td className="px-5 py-3"><SubStatusBadge status={s.status || "—"} /></td>
              <td className="px-5 py-3 text-[12px]" style={mono}>{s.unit_amount ? `R$${(s.unit_amount / 100).toFixed(2)}` : "—"}/{s.recurring_interval || "—"}</td>
              <td className="px-5 py-3 text-[11px] text-white/40" style={mono}>{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString("pt-BR") : "—"}</td>
              <td className="px-5 py-3 text-[10px] text-white/30" style={mono}>{s.subscription_id?.slice(0, 20) || "—"}</td>
            </tr>
          ))}
          {(!subs || subs.length === 0) && (
            <tr><td colSpan={6} className="px-5 py-10 text-center text-[12px] text-white/30">Nenhuma assinatura</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Invoices Tab ─── */
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
    <div className="overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0F0F17]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {["ID", "Status", "Valor", "Pago em", "PDF"].map((h) => (
              <th key={h} className="px-5 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-white/40">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoices?.map((inv) => (
            <tr key={inv.id} className="border-b border-white/[0.06] last:border-0 hover:bg-[#16161F] transition">
              <td className="px-5 py-3 text-[11px] text-white/50" style={mono}>{inv.id.slice(0, 20)}</td>
              <td className="px-5 py-3"><SubStatusBadge status={inv.status === "paid" ? "active" : inv.status} /></td>
              <td className="px-5 py-3 text-[12px]" style={mono}>R${(inv.amount_due / 100).toFixed(2)}</td>
              <td className="px-5 py-3 text-[11px] text-white/40" style={mono}>{inv.paid_at ? new Date(inv.paid_at).toLocaleDateString("pt-BR") : "—"}</td>
              <td className="px-5 py-3">
                {inv.invoice_pdf && <a href={inv.invoice_pdf} target="_blank" rel="noopener noreferrer" className="text-[11px] text-orange-400 hover:underline">Download</a>}
              </td>
            </tr>
          ))}
          {(!invoices || invoices.length === 0) && (
            <tr><td colSpan={5} className="px-5 py-10 text-center text-[12px] text-white/30">Nenhuma fatura</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
