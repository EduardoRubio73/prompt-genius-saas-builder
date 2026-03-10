import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction } from "@/lib/edgeFunctions";
import { useToast } from "@/hooks/use-toast";
import { Copy, Plus, X, Check, ExternalLink } from "lucide-react";
import "./admin.css";

const WEBHOOK_URL = "https://pcaebfncvuvdguyjmyxm.supabase.co/functions/v1/stripe-sync";

const DEFAULT_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "invoice.payment_succeeded",
];

const settingsKeys = [
  "stripe_secret_key",
  "stripe_publishable_key",
  "stripe_webhook_secret",
  "stripe_mode",
  "stripe_dashboard_url",
] as const;

export default function AdminStripeSettings() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({
    stripe_secret_key: "",
    stripe_publishable_key: "",
    stripe_webhook_secret: "",
    stripe_mode: "TEST",
  });
  const [webhookEvents, setWebhookEvents] = useState<string[]>(DEFAULT_EVENTS);
  const [newEvent, setNewEvent] = useState("");
  const [urlCopied, setUrlCopied] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin-stripe-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("key,value")
        .in("key", [...settingsKeys, "stripe_webhook_events"] as any);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!data) return;
    setForm((prev) => {
      const next = { ...prev };
      for (const row of data) {
        if (row.key !== "stripe_webhook_events") next[row.key] = row.value;
      }
      return next;
    });
    const eventsRow = data.find((r) => r.key === "stripe_webhook_events");
    if (eventsRow) {
      try {
        const parsed = JSON.parse(eventsRow.value);
        if (Array.isArray(parsed) && parsed.length > 0) setWebhookEvents(parsed);
      } catch {}
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const key of settingsKeys) {
        const { error } = await supabase.rpc("admin_upsert_setting", {
          p_key: key,
          p_value: form[key],
          p_category: "stripe",
          p_description: key,
          p_is_secret: key !== "stripe_mode",
        });
        if (error) throw error;
      }
      // Save webhook events
      const { error: evErr } = await supabase.rpc("admin_upsert_setting", {
        p_key: "stripe_webhook_events",
        p_value: JSON.stringify(webhookEvents),
        p_category: "stripe",
        p_description: "Lista de eventos do webhook Stripe",
        p_is_secret: false,
      });
      if (evErr) throw evErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-stripe-settings"] }),
  });

  const testConnection = useMutation({
    mutationFn: async () => {
      return await callEdgeFunction("stripe-test-connection", {});
    },
  });

  const copyUrl = () => {
    navigator.clipboard.writeText(WEBHOOK_URL);
    setUrlCopied(true);
    toast({ title: "URL copiada!" });
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const addEvent = () => {
    const ev = newEvent.trim().toLowerCase();
    if (!ev || webhookEvents.includes(ev)) return;
    setWebhookEvents((prev) => [...prev, ev]);
    setNewEvent("");
  };

  const removeEvent = (ev: string) => {
    setWebhookEvents((prev) => prev.filter((e) => e !== ev));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 className="page-title" style={{ marginBottom: 0 }}>Configuração Stripe</h1>

      {/* API Keys */}
      <div className="table-card" style={{ padding: 20, display: "grid", gap: 12 }}>
        <Field label="Stripe Secret Key">
          <input className="adm-input mono" value={form.stripe_secret_key} onChange={(e) => setForm((f) => ({ ...f, stripe_secret_key: e.target.value }))} />
        </Field>
        <Field label="Stripe Publishable Key">
          <input className="adm-input mono" value={form.stripe_publishable_key} onChange={(e) => setForm((f) => ({ ...f, stripe_publishable_key: e.target.value }))} />
        </Field>
        <Field label="Webhook Secret">
          <input className="adm-input mono" value={form.stripe_webhook_secret} onChange={(e) => setForm((f) => ({ ...f, stripe_webhook_secret: e.target.value }))} />
        </Field>
        <Field label="Modo">
          <select className="adm-input" value={form.stripe_mode} onChange={(e) => setForm((f) => ({ ...f, stripe_mode: e.target.value }))}>
            <option value="TEST">TEST</option>
            <option value="PRODUCTION">PRODUCTION</option>
          </select>
        </Field>
      </div>

      {/* Webhook Configuration */}
      <div className="table-card" style={{ padding: 20, display: "grid", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Configuração do Webhook</h2>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: 0 }}>
            Configure no Stripe Dashboard → Developers → Webhooks
          </p>
        </div>

        {/* URL */}
        <Field label="URL do Webhook (copie e cole no Stripe)">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <code
              style={{
                flex: 1,
                background: "hsl(var(--muted))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                wordBreak: "break-all",
                color: "hsl(var(--foreground))",
              }}
            >
              {WEBHOOK_URL}
            </code>
            <button className="adm-btn outline" onClick={copyUrl} style={{ display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
              {urlCopied ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
            </button>
          </div>
        </Field>

        {/* Events */}
        <Field label="Eventos do Webhook">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            {webhookEvents.map((ev) => (
              <span
                key={ev}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "hsl(var(--muted))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 20,
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: "monospace",
                  color: "hsl(var(--foreground))",
                }}
              >
                {ev}
                <button
                  onClick={() => removeEvent(ev)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    color: "hsl(var(--muted-foreground))",
                  }}
                  title="Remover evento"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="adm-input mono"
              value={newEvent}
              onChange={(e) => setNewEvent(e.target.value)}
              placeholder="ex: invoice.payment_failed"
              onKeyDown={(e) => e.key === "Enter" && addEvent()}
              style={{ flex: 1 }}
            />
            <button className="adm-btn outline" onClick={addEvent} style={{ display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
              <Plus size={14} /> Adicionar
            </button>
          </div>
        </Field>

        <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: 0, lineHeight: 1.5 }}>
          ⚠️ Certifique-se de que todos os eventos acima estão selecionados no Stripe Dashboard para que a automação de planos e bônus funcione corretamente.
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          className="adm-btn outline"
          onClick={async () => {
            try {
              const res = await testConnection.mutateAsync();
              toast({ title: res?.ok ? "Stripe conectado" : "Erro de autenticação", description: res?.message || "" });
            } catch (err: any) {
              toast({ title: "Erro de autenticação", description: err.message, variant: "destructive" });
            }
          }}
        >
          Testar conexão
        </button>
        <button
          className="adm-btn primary"
          onClick={async () => {
            try {
              await saveMutation.mutateAsync();
              toast({ title: "Configurações salvas" });
            } catch (err: any) {
              toast({ title: "Erro", description: err.message, variant: "destructive" });
            }
          }}
        >
          Salvar
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <div>
      <label className="adm-label">{label}</label>
      {children}
    </div>
  );
}
