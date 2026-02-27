import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PlanBadge, SubStatusBadge } from "@/components/admin/Badges";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminBilling() {
  const [tab, setTab] = useState<"subscriptions" | "invoices">("subscriptions");
  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  const { data: subs } = useQuery({
    queryKey: ["admin-billing-overview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_billing_overview")
        .select("*")
        .order("current_period_end", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: invoices } = useQuery({
    queryKey: ["admin-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_invoices")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: tab === "invoices",
  });

  return (
    <div className="space-y-5 animate-in fade-in">
      <h2 className="text-lg font-semibold">Planos e Billing</h2>

      <div className="flex gap-1 rounded-lg bg-[#16161F] p-1 w-fit">
        {(["subscriptions", "invoices"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-[12px] font-medium transition ${
              tab === t ? "bg-orange-500/15 text-orange-400" : "text-white/50 hover:text-white/80"
            }`}
          >
            {t === "subscriptions" ? "Assinaturas" : "Faturas"}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0F0F17]">
        {tab === "subscriptions" && (
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
                  <td className="px-5 py-3 text-[12px]" style={mono}>
                    {s.unit_amount ? `R$${(s.unit_amount / 100).toFixed(2)}` : "—"}/{s.recurring_interval || "—"}
                  </td>
                  <td className="px-5 py-3 text-[11px] text-white/40" style={mono}>
                    {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-5 py-3 text-[10px] text-white/30" style={mono}>{s.subscription_id?.slice(0, 20) || "—"}</td>
                </tr>
              ))}
              {(!subs || subs.length === 0) && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-[12px] text-white/30">Nenhuma assinatura</td></tr>
              )}
            </tbody>
          </table>
        )}

        {tab === "invoices" && (
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
                  <td className="px-5 py-3">
                    <SubStatusBadge status={inv.status === "paid" ? "active" : inv.status} />
                  </td>
                  <td className="px-5 py-3 text-[12px]" style={mono}>R${(inv.amount_due / 100).toFixed(2)}</td>
                  <td className="px-5 py-3 text-[11px] text-white/40" style={mono}>
                    {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-5 py-3">
                    {inv.invoice_pdf && (
                      <a href={inv.invoice_pdf} target="_blank" rel="noopener noreferrer" className="text-[11px] text-orange-400 hover:underline">Download</a>
                    )}
                  </td>
                </tr>
              ))}
              {(!invoices || invoices.length === 0) && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-[12px] text-white/30">Nenhuma fatura</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
