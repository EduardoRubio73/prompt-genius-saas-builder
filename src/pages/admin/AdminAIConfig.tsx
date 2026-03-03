import { useState } from "react";
import { useAdminSettings, useUpsertSetting, useAdminModelConfigs, useCreateModelConfig, useUpdateModelConfig, useDeleteModelConfig } from "@/hooks/admin/useAdminData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Flag, Plus, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import "./admin.css";

export default function AdminAIConfig() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"settings" | "models">("settings");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Configurações de IA</h1>
        <div className="adm-tabs">
          {(["settings", "models"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`adm-tab ${tab === t ? "active" : ""}`}>
              {t === "settings" ? "Settings" : "Model Configs"}
            </button>
          ))}
        </div>
      </div>

      {tab === "settings" && <SettingsSection />}
      {tab === "models" && <ModelConfigsSection />}

      <div className="table-card" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Feature Flags</div>
            <div style={{ fontSize: 12, color: "var(--adm-text-soft)", marginTop: 4 }}>Gerencie os feature flags na página dedicada</div>
          </div>
          <button className="adm-btn outline" onClick={() => navigate("/admin/flags")}><Flag size={14} /> Gerenciar Flags</button>
        </div>
      </div>
    </div>
  );
}

function SettingsSection() {
  const { data: settings, isLoading } = useAdminSettings();
  const upsertSetting = useUpsertSetting();
  const { toast } = useToast();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const startEdit = (key: string, value: string) => { setEditingKey(key); setEditValue(value); };
  const saveEdit = async () => {
    if (!editingKey) return;
    try { await upsertSetting.mutateAsync({ p_key: editingKey, p_value: editValue }); toast({ title: "Salvo" }); setEditingKey(null); }
    catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  return (
    <div className="table-card">
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--adm-border)", fontSize: 14, fontWeight: 700 }}>Settings</div>
      <div>
        {isLoading && <div style={{ padding: "32px", textAlign: "center", color: "var(--adm-text-soft)" }}>Carregando...</div>}
        {settings?.map((s) => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 20px", borderBottom: "1px solid var(--adm-border)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontFamily: "var(--adm-mono)", color: "var(--adm-accent)" }}>{s.key}</div>
              <div style={{ fontSize: 12, color: "var(--adm-text-soft)", marginTop: 2 }}>{s.description || "—"}</div>
            </div>
            {editingKey === s.key ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input className="adm-input mono" style={{ width: 200, height: 30 }} value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus />
                <button className="adm-btn primary" style={{ padding: "4px 12px" }} onClick={saveEdit}>Salvar</button>
                <button className="adm-btn ghost" onClick={() => setEditingKey(null)}>✕</button>
              </div>
            ) : (
              <>
                <div style={{ fontFamily: "var(--adm-mono)", fontSize: 12, padding: "4px 10px", borderRadius: 7, background: "var(--adm-bg)", border: "1px solid var(--adm-border)", cursor: "pointer" }}
                  onClick={() => { if (s.is_secret && !revealedKeys.has(s.key)) setRevealedKeys((p) => new Set(p).add(s.key)); }}>
                  {s.is_secret && !revealedKeys.has(s.key) ? "••••••••••••" : s.value}
                </div>
                <button className="adm-btn ghost" onClick={() => startEdit(s.key, s.value)}>✎</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ModelConfigsSection() {
  const { data: models } = useAdminModelConfigs();
  const createModel = useCreateModelConfig();
  const updateModel = useUpdateModelConfig();
  const deleteModel = useDeleteModelConfig();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const emptyForm = () => ({ display_name: "", model_id: "", provider: "", action_type: "refine", temperature: 0.3, max_tokens: 1000, is_active: true, is_default: false, cost_per_1k_input: "", cost_per_1k_output: "", notes: "" });
  const openCreate = () => { setForm(emptyForm()); setShowCreate(true); };
  const openEdit = (m: any) => {
    setEditing(m);
    setForm({ display_name: m.display_name, model_id: m.model_id, provider: m.provider, action_type: m.action_type, temperature: m.temperature, max_tokens: m.max_tokens, is_active: m.is_active, is_default: m.is_default, cost_per_1k_input: m.cost_per_1k_input ?? "", cost_per_1k_output: m.cost_per_1k_output ?? "", notes: m.notes || "" });
  };

  const saveModel = async () => {
    try {
      const payload = { ...form, temperature: Number(form.temperature), max_tokens: Number(form.max_tokens), cost_per_1k_input: form.cost_per_1k_input !== "" ? Number(form.cost_per_1k_input) : null, cost_per_1k_output: form.cost_per_1k_output !== "" ? Number(form.cost_per_1k_output) : null };
      if (editing) await updateModel.mutateAsync({ id: editing.id, updates: payload });
      else await createModel.mutateAsync(payload);
      toast({ title: editing ? "Modelo atualizado" : "Modelo criado" });
      setShowCreate(false); setEditing(null);
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este modelo?")) return;
    try { await deleteModel.mutateAsync(id); toast({ title: "Modelo excluído" }); } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  const toggleActive = async (m: any) => {
    try { await updateModel.mutateAsync({ id: m.id, updates: { is_active: !m.is_active } }); } catch {}
  };

  const formFields = [
    { key: "display_name", label: "Nome" }, { key: "model_id", label: "Model ID" },
    { key: "provider", label: "Provider" }, { key: "action_type", label: "Action Type" },
    { key: "temperature", label: "Temperature", type: "number" }, { key: "max_tokens", label: "Max Tokens", type: "number" },
    { key: "cost_per_1k_input", label: "Cost/1k Input", type: "number" }, { key: "cost_per_1k_output", label: "Cost/1k Output", type: "number" },
    { key: "notes", label: "Notas", span: true },
  ];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="adm-btn primary" onClick={openCreate}><Plus size={14} /> Novo Modelo</button>
      </div>
      <div className="table-card">
        <table>
          <thead><tr>
            {["Nome", "Model ID", "Provider", "Ação", "Temp", "Max Tokens", "Status", "Default", "Ações"].map((h) => <th key={h}>{h}</th>)}
          </tr></thead>
          <tbody>
            {models?.map((m) => (
              <tr key={m.id}>
                <td style={{ fontWeight: 600 }}>{m.display_name}</td>
                <td style={{ fontSize: 11, fontFamily: "var(--adm-mono)", color: "var(--adm-text-soft)" }}>{m.model_id}</td>
                <td style={{ color: "var(--adm-text-soft)" }}>{m.provider}</td>
                <td style={{ color: "var(--adm-text-soft)" }}>{m.action_type}</td>
                <td style={{ fontFamily: "var(--adm-mono)" }}>{m.temperature}</td>
                <td style={{ fontFamily: "var(--adm-mono)" }}>{m.max_tokens}</td>
                <td>
                  <button onClick={() => toggleActive(m)} className={`adm-badge ${m.is_active ? "active" : "inactive"}`} style={{ cursor: "pointer" }}>
                    {m.is_active ? "Ativo" : "Off"}
                  </button>
                </td>
                <td>{m.is_default ? "⭐" : "—"}</td>
                <td>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="adm-btn ghost" onClick={() => openEdit(m)}><Pencil size={14} /></button>
                    <button className="adm-btn ghost" style={{ color: "var(--adm-red)" }} onClick={() => handleDelete(m.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {(!models || models.length === 0) && <tr><td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "var(--adm-text-soft)" }}>Nenhum modelo configurado</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={showCreate || !!editing} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditing(null); } }}>
        <DialogContent className="border-[var(--adm-border)] bg-[var(--adm-surface)] text-[var(--adm-text)] max-w-[660px] rounded-[18px]">
          <DialogHeader><DialogTitle style={{ fontSize: 16, fontWeight: 800 }}>{editing ? "Editar Modelo" : "Novo Modelo"}</DialogTitle></DialogHeader>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            {formFields.map(({ key, label, type, span }) => (
              <div key={key} style={span ? { gridColumn: "1 / -1" } : undefined}>
                <label className="adm-label">{label}</label>
                <input className="adm-input mono" value={form[key] ?? ""} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} type={type || "text"} />
              </div>
            ))}
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} /> Ativo
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <input type="checkbox" checked={form.is_default ?? false} onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))} /> Default
              </label>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <button className="adm-btn outline" onClick={() => { setShowCreate(false); setEditing(null); }}>Cancelar</button>
            <button className="adm-btn primary" onClick={saveModel}>Salvar</button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
