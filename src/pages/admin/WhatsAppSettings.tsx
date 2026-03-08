import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Eye, EyeOff, Save, RefreshCw, CheckCircle2, XCircle } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Setting {
  key: string;
  value: string;
  description: string;
  is_secret: boolean;
}

const KEYS = ["evolution_api_url", "evolution_api_key", "evolution_instance"] as const;

const META: Record<string, { label: string; placeholder: string; description: string; is_secret: boolean }> = {
  evolution_api_url: {
    label: "URL da API",
    placeholder: "https://evo.seudominio.com",
    description: "URL base da Evolution API (sem barra no final)",
    is_secret: false,
  },
  evolution_api_key: {
    label: "API Key (Token)",
    placeholder: "••••••••••••••••••••",
    description: "Token de autenticação da Evolution API",
    is_secret: true,
  },
  evolution_instance: {
    label: "Nome da Instância",
    placeholder: "minha-instancia",
    description: "Nome exato da instância conectada no Evolution",
    is_secret: false,
  },
};

// ─── Componente ───────────────────────────────────────────────────────────────
export default function WhatsAppSettings() {
  const { toast } = useToast();

  const [values, setValues]         = useState<Record<string, string>>({ evolution_api_url: "", evolution_api_key: "", evolution_instance: "" });
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [testing, setTesting]       = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  // ─── Carrega configs do banco ────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("admin_settings")
        .select("key, value")
        .eq("category", "whatsapp");

      if (error) {
        toast({ title: "Erro ao carregar configurações", description: error.message, variant: "destructive" });
      } else if (data) {
        const map: Record<string, string> = {};
        data.forEach((row) => { map[row.key] = row.value; });
        setValues((prev) => ({ ...prev, ...map }));
      }
      setLoading(false);
    };
    load();
  }, []);

  // ─── Salva configs no banco ───────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setTestResult(null);
    try {
      for (const key of KEYS) {
        const meta = META[key];
        const { error } = await supabase
          .from("admin_settings")
          .upsert(
            {
              key,
              value:       values[key],
              description: meta.description,
              category:    "whatsapp",
              is_secret:   meta.is_secret,
            },
            { onConflict: "key" }
          );
        if (error) throw new Error(`Erro ao salvar ${key}: ${error.message}`);
      }
      toast({ title: "✅ Configurações salvas!", description: "Evolution API atualizada com sucesso." });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ─── Testa conexão com a Evolution API ───────────────────────────────────
  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const url      = values["evolution_api_url"]?.replace(/\/$/, "");
      const apiKey   = values["evolution_api_key"];
      const instance = values["evolution_instance"];

      if (!url || !apiKey || !instance) throw new Error("Preencha todos os campos antes de testar.");

      const response = await fetch(`${url}/instance/fetchInstances`, {
        method:  "GET",
        headers: { apikey: apiKey },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status} — verifique a URL e o token.`);

      const data = await response.json();
      const instances: string[] = Array.isArray(data)
        ? data.map((i: any) => i?.instance?.instanceName ?? i?.name ?? "")
        : [];

      if (instances.some((n) => n === instance)) {
        setTestResult("success");
        toast({ title: "✅ Conexão OK!", description: `Instância "${instance}" encontrada e ativa.` });
      } else {
        setTestResult("error");
        toast({
          title: "⚠️ Instância não encontrada",
          description: `Instâncias disponíveis: ${instances.join(", ") || "nenhuma"}`,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setTestResult("error");
      toast({ title: "Erro ao testar", description: err.message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
        <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", opacity: 0.5 }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "var(--adm-accent)", opacity: 0.15,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            <MessageCircle size={18} style={{ position: "absolute", color: "var(--adm-accent)", opacity: 1 }} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Config. WhatsApp</h2>
            <p style={{ fontSize: 12, color: "var(--adm-text-soft)", margin: 0 }}>Evolution API — credenciais de integração</p>
          </div>
        </div>
      </div>

      {/* Card de campos */}
      <div style={{
        border: "1px solid var(--adm-border)",
        borderRadius: 14,
        background: "var(--adm-surface)",
        overflow: "hidden",
      }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--adm-border)" }}>
          <p style={{ fontSize: 12, color: "var(--adm-text-soft)", margin: 0 }}>
            As configurações abaixo são armazenadas na tabela <code style={{ fontSize: 11, background: "var(--adm-bg)", padding: "1px 6px", borderRadius: 4 }}>admin_settings</code> e utilizadas para envio de códigos de verificação via WhatsApp.
          </p>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 24 }}>
          {KEYS.map((key) => {
            const meta    = META[key];
            const isPass  = meta.is_secret;
            const type    = isPass && !showSecret ? "password" : "text";

            return (
              <div key={key}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>{meta.label}</label>
                  {isPass && (
                    <button
                      type="button"
                      onClick={() => setShowSecret((s) => !s)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--adm-text-soft)", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}
                    >
                      {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showSecret ? "Ocultar" : "Mostrar"}
                    </button>
                  )}
                </div>
                <input
                  type={type}
                  value={values[key]}
                  onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={meta.placeholder}
                  className="adm-input"
                  style={{ width: "100%", fontFamily: isPass ? "monospace" : undefined }}
                />
                <p style={{ fontSize: 11, color: "var(--adm-text-soft)", marginTop: 4, marginBottom: 0 }}>
                  {meta.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer com botões */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--adm-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}>

          {/* Status do teste */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            {testResult === "success" && (
              <><CheckCircle2 size={14} style={{ color: "#22c55e" }} /><span style={{ color: "#22c55e" }}>Conexão verificada</span></>
            )}
            {testResult === "error" && (
              <><XCircle size={14} style={{ color: "#ef4444" }} /><span style={{ color: "#ef4444" }}>Falha na conexão</span></>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || saving}
              className="adm-btn outline"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={14} style={testing ? { animation: "spin 1s linear infinite" } : undefined} />
              {testing ? "Testando..." : "Testar conexão"}
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || testing}
              className="adm-btn"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <Save size={14} />
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>

      {/* Info extra */}
      <div style={{
        marginTop: 16,
        padding: "12px 16px",
        borderRadius: 10,
        border: "1px solid var(--adm-border)",
        background: "var(--adm-bg)",
        fontSize: 12,
        color: "var(--adm-text-soft)",
        lineHeight: 1.6,
      }}>
        <strong style={{ color: "var(--adm-text)" }}>Como obter as credenciais:</strong>
        <ul style={{ margin: "6px 0 0 0", paddingLeft: 16 }}>
          <li><strong>URL da API</strong> — endereço onde sua Evolution API está hospedada</li>
          <li><strong>API Key</strong> — token gerado nas configurações globais do Evolution</li>
          <li><strong>Instância</strong> — nome da instância com WhatsApp conectado (QR Code escaneado)</li>
        </ul>
      </div>

    </div>
  );
}
