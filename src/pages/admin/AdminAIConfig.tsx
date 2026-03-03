import { useState } from "react";
import { useAdminSettings, useUpsertSetting, useAdminModelConfigs, useCreateModelConfig, useUpdateModelConfig, useDeleteModelConfig } from "@/hooks/admin/useAdminData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Flag, Plus, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const mono = { fontFamily: "'IBM Plex Mono', monospace" };

export default function AdminAIConfig() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"settings" | "models">("settings");

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-lg font-semibold">Configurações de IA</h2>
      <div className="flex gap-1 rounded-lg bg-[#16161F] p-1 w-fit">
        {(["settings", "models"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1 text-[11px] font-medium transition ${tab === t ? "bg-orange-500/15 text-orange-400" : "text-white/50 hover:text-white/80"}`}>
            {t === "settings" ? "Settings" : "Model Configs"}
          </button>
        ))}
      </div>

      {tab === "settings" && <SettingsSection />}
      {tab === "models" && <ModelConfigsSection />}

      <div className="rounded-[10px] border border-white/[0.06] bg-[#0F0F17] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium">Feature Flags</p>
            <p className="text-[12px] text-white/40 mt-0.5">Gerencie os feature flags na página dedicada</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/flags")}
            className="gap-2 border-white/10 bg-transparent text-[12px] text-white/65 hover:bg-[#16161F] hover:text-orange-400">
            <Flag className="h-4 w-4" /> Gerenciar Flags
          </Button>
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
    try {
      await upsertSetting.mutateAsync({ p_key: editingKey, p_value: editValue });
      toast({ title: "Salvo", description: `${editingKey} atualizado.` });
      setEditingKey(null);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0F0F17]">
      <div className="border-b border-white/[0.06] px-5 py-4"><span className="text-[13px] font-semibold">Settings</span></div>
      <div className="divide-y divide-white/[0.06]">
        {isLoading && <div className="px-5 py-8 text-center text-[12px] text-white/30">Carregando...</div>}
        {settings?.map((s) => (
          <div key={s.key} className="flex items-center gap-4 px-5 py-3.5">
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-orange-300" style={mono}>{s.key}</div>
              <div className="text-[12px] text-white/40 mt-0.5">{s.description || "—"}</div>
            </div>
            {editingKey === s.key ? (
              <div className="flex items-center gap-2">
                <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-7 w-48 border-white/10 bg-[#16161F] text-[12px] text-[#E8E6F0]" style={mono} autoFocus />
                <Button size="sm" onClick={saveEdit} className="h-7 bg-orange-500 text-[11px] text-black hover:bg-orange-400">Salvar</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingKey(null)} className="h-7 text-[11px] text-white/50">✕</Button>
              </div>
            ) : (
              <>
                <div className="cursor-pointer rounded-md border border-white/10 bg-[#16161F] px-2.5 py-1 text-[12px]" style={mono}
                  onClick={() => { if (s.is_secret && !revealedKeys.has(s.key)) setRevealedKeys((p) => new Set(p).add(s.key)); }}>
                  {s.is_secret && !revealedKeys.has(s.key) ? "••••••••••••" : s.value}
                </div>
                <button onClick={() => startEdit(s.key, s.value)} className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-[#16161F] text-[12px] text-white/40 transition hover:border-orange-500/50 hover:text-orange-400">✎</button>
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

  const emptyForm = () => ({
    display_name: "", model_id: "", provider: "", action_type: "refine",
    temperature: 0.3, max_tokens: 1000, is_active: true, is_default: false,
    cost_per_1k_input: "", cost_per_1k_output: "", notes: "",
  });

  const openCreate = () => { setForm(emptyForm()); setShowCreate(true); };
  const openEdit = (m: any) => {
    setEditing(m);
    setForm({
      display_name: m.display_name, model_id: m.model_id, provider: m.provider, action_type: m.action_type,
      temperature: m.temperature, max_tokens: m.max_tokens, is_active: m.is_active, is_default: m.is_default,
      cost_per_1k_input: m.cost_per_1k_input ?? "", cost_per_1k_output: m.cost_per_1k_output ?? "", notes: m.notes || "",
    });
  };

  const saveModel = async () => {
    try {
      const payload = {
        ...form,
        temperature: Number(form.temperature),
        max_tokens: Number(form.max_tokens),
        cost_per_1k_input: form.cost_per_1k_input !== "" ? Number(form.cost_per_1k_input) : null,
        cost_per_1k_output: form.cost_per_1k_output !== "" ? Number(form.cost_per_1k_output) : null,
      };
      if (editing) {
        await updateModel.mutateAsync({ id: editing.id, updates: payload });
      } else {
        await createModel.mutateAsync(payload);
      }
      toast({ title: editing ? "Modelo atualizado" : "Modelo criado" });
      setShowCreate(false); setEditing(null);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este modelo?")) return;
    try { await deleteModel.mutateAsync(id); toast({ title: "Modelo excluído" }); } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  const toggleActive = async (m: any) => {
    try { await updateModel.mutateAsync({ id: m.id, updates: { is_active: !m.is_active } }); } catch {}
  };

  return (
    <>
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate} className="gap-2 bg-orange-500 text-[12px] text-black hover:bg-orange-400">
          <Plus className="h-3.5 w-3.5" /> Novo Modelo
        </Button>
      </div>
      <div className="overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0F0F17]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["Nome", "Model ID", "Provider", "Ação", "Temp", "Max Tokens", "Status", "Default", "Ações"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-white/40">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models?.map((m) => (
              <tr key={m.id} className="border-b border-white/[0.06] last:border-0 hover:bg-[#16161F] transition">
                <td className="px-4 py-3 text-[12px] font-medium">{m.display_name}</td>
                <td className="px-4 py-3 text-[11px] text-white/50" style={mono}>{m.model_id}</td>
                <td className="px-4 py-3 text-[11px] text-white/50">{m.provider}</td>
                <td className="px-4 py-3 text-[11px] text-white/50">{m.action_type}</td>
                <td className="px-4 py-3 text-[11px] text-white/65" style={mono}>{m.temperature}</td>
                <td className="px-4 py-3 text-[11px] text-white/65" style={mono}>{m.max_tokens}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(m)} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${m.is_active ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                    {m.is_active ? "Ativo" : "Off"}
                  </button>
                </td>
                <td className="px-4 py-3 text-[11px] text-white/50">{m.is_default ? "⭐" : "—"}</td>
                <td className="px-4 py-3 flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(m)} className="h-6 w-6 p-0 text-white/40 hover:text-orange-400"><Pencil className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)} className="h-6 w-6 p-0 text-white/40 hover:text-red-400"><Trash2 className="h-3 w-3" /></Button>
                </td>
              </tr>
            ))}
            {(!models || models.length === 0) && <tr><td colSpan={9} className="px-5 py-10 text-center text-[12px] text-white/30">Nenhum modelo configurado</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={showCreate || !!editing} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditing(null); } }}>
        <DialogContent className="max-w-lg border-white/[0.06] bg-[#0F0F17] text-[#E8E6F0]">
          <DialogHeader><DialogTitle className="text-[15px]">{editing ? "Editar Modelo" : "Novo Modelo"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {[
              { key: "display_name", label: "Nome" }, { key: "model_id", label: "Model ID" },
              { key: "provider", label: "Provider" }, { key: "action_type", label: "Action Type" },
              { key: "temperature", label: "Temperature", type: "number" }, { key: "max_tokens", label: "Max Tokens", type: "number" },
              { key: "cost_per_1k_input", label: "Cost/1k Input", type: "number" }, { key: "cost_per_1k_output", label: "Cost/1k Output", type: "number" },
              { key: "notes", label: "Notas" },
            ].map(({ key, label, type }) => (
              <div key={key} className={key === "notes" ? "col-span-2" : ""}>
                <label className="text-[11px] text-white/40 mb-1 block">{label}</label>
                <Input value={form[key] ?? ""} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="h-8 border-white/10 bg-[#16161F] text-[12px]" type={type || "text"} style={mono} />
              </div>
            ))}
            <div className="flex items-center gap-4 col-span-2">
              <label className="flex items-center gap-2 text-[12px] text-white/65">
                <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} /> Ativo
              </label>
              <label className="flex items-center gap-2 text-[12px] text-white/65">
                <input type="checkbox" checked={form.is_default ?? false} onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))} /> Default
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => { setShowCreate(false); setEditing(null); }} className="text-[12px] text-white/50">Cancelar</Button>
            <Button size="sm" onClick={saveModel} className="bg-orange-500 text-[12px] text-black hover:bg-orange-400">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
