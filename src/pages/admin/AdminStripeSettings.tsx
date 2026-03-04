import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction } from "@/lib/edgeFunctions";
import { useToast } from "@/hooks/use-toast";
import "./admin.css";

const settingsKeys = [
  "stripe_secret_key",
  "stripe_publishable_key",
  "stripe_webhook_secret",
  "stripe_mode",
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

  const { data } = useQuery({
    queryKey: ["admin-stripe-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_settings").select("key,value").in("key", settingsKeys as any);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!data) return;
    setForm((prev) => {
      const next = { ...prev };
      for (const row of data) next[row.key] = row.value;
      return next;
    });
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
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-stripe-settings"] }),
  });

  const testConnection = useMutation({
    mutationFn: async () => {
      return await callEdgeFunction("stripe-test-connection", {});
    },
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 className="page-title" style={{ marginBottom: 0 }}>Configuração Stripe</h1>
      <div className="table-card" style={{ padding: 20, display: "grid", gap: 12 }}>
        <Field label="Stripe Secret Key"><input className="adm-input mono" value={form.stripe_secret_key} onChange={(e) => setForm((f) => ({ ...f, stripe_secret_key: e.target.value }))} /></Field>
        <Field label="Stripe Publishable Key"><input className="adm-input mono" value={form.stripe_publishable_key} onChange={(e) => setForm((f) => ({ ...f, stripe_publishable_key: e.target.value }))} /></Field>
        <Field label="Webhook Secret"><input className="adm-input mono" value={form.stripe_webhook_secret} onChange={(e) => setForm((f) => ({ ...f, stripe_webhook_secret: e.target.value }))} /></Field>
        <Field label="Modo">
          <select className="adm-input" value={form.stripe_mode} onChange={(e) => setForm((f) => ({ ...f, stripe_mode: e.target.value }))}>
            <option value="TEST">TEST</option>
            <option value="PRODUCTION">PRODUCTION</option>
          </select>
        </Field>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="adm-btn outline" onClick={async () => {
            try {
              const res = await testConnection.mutateAsync();
              toast({ title: res?.ok ? "Stripe conectado" : "Erro de autenticação", description: res?.message || "" });
            } catch (err: any) {
              toast({ title: "Erro de autenticação", description: err.message, variant: "destructive" });
            }
          }}>Testar conexão</button>
          <button className="adm-btn primary" onClick={async () => {
            try { await saveMutation.mutateAsync(); toast({ title: "Configurações salvas" }); }
            catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
          }}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return <div><label className="adm-label">{label}</label>{children}</div>;
}
