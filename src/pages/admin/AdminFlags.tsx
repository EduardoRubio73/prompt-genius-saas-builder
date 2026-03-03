import { useState } from "react";
import { useAdminFeatureFlags, useToggleFeatureFlag, useCreateFeatureFlag, useUpdateFeatureFlag, useDeleteFeatureFlag } from "@/hooks/admin/useAdminData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import "./admin.css";

export default function AdminFlags() {
  const { data: flags } = useAdminFeatureFlags();
  const toggleFlag = useToggleFeatureFlag();
  const createFlag = useCreateFeatureFlag();
  const updateFlag = useUpdateFeatureFlag();
  const deleteFlag = useDeleteFeatureFlag();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ flag: "", label: "", description: "", rollout_pct: 100, enabled: false });

  const handleToggle = async (flag: string, currentEnabled: boolean) => {
    try { await toggleFlag.mutateAsync({ flag, enabled: !currentEnabled }); toast({ title: "Flag atualizada" }); }
    catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  const openCreate = () => { setForm({ flag: "", label: "", description: "", rollout_pct: 100, enabled: false }); setShowCreate(true); };
  const openEdit = (f: any) => { setEditing(f); setForm({ flag: f.flag, label: f.label, description: f.description || "", rollout_pct: f.rollout_pct, enabled: f.enabled }); };

  const saveFlag = async () => {
    try {
      if (editing) {
        await updateFlag.mutateAsync({ id: editing.id, updates: { label: form.label, description: form.description || null, rollout_pct: Number(form.rollout_pct), enabled: form.enabled } });
        toast({ title: "Flag atualizada" });
      } else {
        await createFlag.mutateAsync({ flag: form.flag, label: form.label, description: form.description, rollout_pct: Number(form.rollout_pct), enabled: form.enabled });
        toast({ title: "Flag criada" });
      }
      setShowCreate(false); setEditing(null);
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta flag?")) return;
    try { await deleteFlag.mutateAsync(id); toast({ title: "Flag excluída" }); } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Feature Flags</h1>
        <button className="adm-btn primary" onClick={openCreate}><Plus size={14} /> Nova Flag</button>
      </div>

      <div className="table-card">
        <div>
          {flags?.map((f) => (
            <div key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--adm-border)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{f.label}</div>
                <div style={{ fontSize: 12, color: "var(--adm-text-soft)", marginTop: 4 }}>{f.description || f.flag}</div>
                <div style={{ fontSize: 10, fontFamily: "var(--adm-mono)", color: "var(--adm-accent)", opacity: .6, marginTop: 4 }}>{f.flag} · rollout: {f.rollout_pct}%</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button className="adm-btn ghost" onClick={() => openEdit(f)}><Pencil size={14} /></button>
                <button className="adm-btn ghost" style={{ color: "var(--adm-red)" }} onClick={() => handleDelete(f.id)}><Trash2 size={14} /></button>
                <button onClick={() => handleToggle(f.flag, f.enabled)} className={`adm-toggle ${f.enabled ? "on" : "off"}`}>
                  <div className="adm-toggle-dot" />
                </button>
              </div>
            </div>
          ))}
          {(!flags || flags.length === 0) && (
            <div style={{ padding: "40px 20px", textAlign: "center", fontSize: 12, color: "var(--adm-text-soft)" }}>Nenhuma flag configurada.</div>
          )}
        </div>
      </div>

      <Dialog open={showCreate || !!editing} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditing(null); } }}>
        <DialogContent className="border-[var(--adm-border)] bg-[var(--adm-surface)] text-[var(--adm-text)] max-w-[500px] rounded-[18px]">
          <DialogHeader><DialogTitle style={{ fontSize: 16, fontWeight: 800 }}>{editing ? "Editar Flag" : "Nova Flag"}</DialogTitle></DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            {!editing && (
              <div>
                <label className="adm-label">Flag Key</label>
                <input className="adm-input mono" value={form.flag} onChange={(e) => setForm((f) => ({ ...f, flag: e.target.value }))} placeholder="ex: enable_build_mode" />
              </div>
            )}
            <div>
              <label className="adm-label">Label</label>
              <input className="adm-input" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
            </div>
            <div>
              <label className="adm-label">Descrição</label>
              <input className="adm-input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="adm-label">Rollout %</label>
              <input className="adm-input mono" type="number" value={form.rollout_pct} onChange={(e) => setForm((f) => ({ ...f, rollout_pct: Number(e.target.value) }))} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} /> Habilitada
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <button className="adm-btn outline" onClick={() => { setShowCreate(false); setEditing(null); }}>Cancelar</button>
            <button className="adm-btn primary" onClick={saveFlag}>Salvar</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
