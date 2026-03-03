import { useState } from "react";
import { useAdminFeatureFlags, useToggleFeatureFlag, useCreateFeatureFlag, useUpdateFeatureFlag, useDeleteFeatureFlag } from "@/hooks/admin/useAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

const mono = { fontFamily: "'IBM Plex Mono', monospace" };

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
    try {
      await toggleFlag.mutateAsync({ flag, enabled: !currentEnabled });
      toast({ title: "Flag atualizada" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const openCreate = () => {
    setForm({ flag: "", label: "", description: "", rollout_pct: 100, enabled: false });
    setShowCreate(true);
  };

  const openEdit = (f: any) => {
    setEditing(f);
    setForm({ flag: f.flag, label: f.label, description: f.description || "", rollout_pct: f.rollout_pct, enabled: f.enabled });
  };

  const saveFlag = async () => {
    try {
      if (editing) {
        await updateFlag.mutateAsync({
          id: editing.id,
          updates: { label: form.label, description: form.description || null, rollout_pct: Number(form.rollout_pct), enabled: form.enabled },
        });
        toast({ title: "Flag atualizada" });
      } else {
        await createFlag.mutateAsync({ flag: form.flag, label: form.label, description: form.description, rollout_pct: Number(form.rollout_pct), enabled: form.enabled });
        toast({ title: "Flag criada" });
      }
      setShowCreate(false); setEditing(null);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta flag?")) return;
    try { await deleteFlag.mutateAsync(id); toast({ title: "Flag excluída" }); } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Feature Flags</h2>
        <Button size="sm" onClick={openCreate} className="gap-2 bg-orange-500 text-[12px] text-black hover:bg-orange-400">
          <Plus className="h-3.5 w-3.5" /> Nova Flag
        </Button>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0F0F17]">
        <div className="divide-y divide-white/[0.06]">
          {flags?.map((f) => (
            <div key={f.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex-1">
                <div className="text-[13px] font-medium">{f.label}</div>
                <div className="text-[12px] text-white/40 mt-0.5">{f.description || f.flag}</div>
                <div className="text-[10px] text-orange-400/60 mt-1" style={mono}>{f.flag} · rollout: {f.rollout_pct}%</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(f)} className="h-7 w-7 p-0 text-white/40 hover:text-orange-400"><Pencil className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(f.id)} className="h-7 w-7 p-0 text-white/40 hover:text-red-400"><Trash2 className="h-3 w-3" /></Button>
                <button onClick={() => handleToggle(f.flag, f.enabled)}
                  className={`relative h-[22px] w-10 shrink-0 rounded-full transition-colors ${f.enabled ? "bg-green-500" : "border border-white/10 bg-[#1C1C28]"}`}>
                  <div className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow transition-[left] ${f.enabled ? "left-[21px]" : "left-[3px]"}`} />
                </button>
              </div>
            </div>
          ))}
          {(!flags || flags.length === 0) && (
            <div className="px-5 py-10 text-center text-[12px] text-white/30">Nenhuma flag configurada.</div>
          )}
        </div>
      </div>

      <Dialog open={showCreate || !!editing} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditing(null); } }}>
        <DialogContent className="max-w-md border-white/[0.06] bg-[#0F0F17] text-[#E8E6F0]">
          <DialogHeader><DialogTitle className="text-[15px]">{editing ? "Editar Flag" : "Nova Flag"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-3">
            {!editing && (
              <div>
                <label className="text-[11px] text-white/40 mb-1 block">Flag Key</label>
                <Input value={form.flag} onChange={(e) => setForm((f) => ({ ...f, flag: e.target.value }))} placeholder="ex: enable_build_mode"
                  className="h-8 border-white/10 bg-[#16161F] text-[12px]" style={mono} />
              </div>
            )}
            <div>
              <label className="text-[11px] text-white/40 mb-1 block">Label</label>
              <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} className="h-8 border-white/10 bg-[#16161F] text-[12px]" />
            </div>
            <div>
              <label className="text-[11px] text-white/40 mb-1 block">Descrição</label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="h-8 border-white/10 bg-[#16161F] text-[12px]" />
            </div>
            <div>
              <label className="text-[11px] text-white/40 mb-1 block">Rollout %</label>
              <Input type="number" value={form.rollout_pct} onChange={(e) => setForm((f) => ({ ...f, rollout_pct: Number(e.target.value) }))} className="h-8 border-white/10 bg-[#16161F] text-[12px]" style={mono} />
            </div>
            <label className="flex items-center gap-2 text-[12px] text-white/65">
              <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} /> Habilitada
            </label>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => { setShowCreate(false); setEditing(null); }} className="text-[12px] text-white/50">Cancelar</Button>
            <Button size="sm" onClick={saveFlag} className="bg-orange-500 text-[12px] text-black hover:bg-orange-400">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
