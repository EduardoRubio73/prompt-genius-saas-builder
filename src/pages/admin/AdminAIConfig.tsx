import { useState } from "react";
import { useAdminSettings, useUpsertSetting } from "@/hooks/admin/useAdminData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function AdminAIConfig() {
  const navigate = useNavigate();
  const { data: settings, isLoading } = useAdminSettings();
  const upsertSetting = useUpsertSetting();
  const { toast } = useToast();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  const startEdit = (key: string, value: string) => {
    setEditingKey(key);
    setEditValue(value);
  };

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
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-lg font-semibold">Configurações de IA</h2>

      <div className="overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0F0F17]">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <span className="text-[13px] font-semibold">Settings</span>
        </div>
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
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="h-7 w-48 border-white/10 bg-[#16161F] text-[12px] text-[#E8E6F0]"
                    style={mono}
                    autoFocus
                  />
                  <Button size="sm" onClick={saveEdit} className="h-7 bg-orange-500 text-[11px] text-black hover:bg-orange-400">
                    Salvar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingKey(null)} className="h-7 text-[11px] text-white/50">
                    ✕
                  </Button>
                </div>
              ) : (
                <>
                  <div
                    className="cursor-pointer rounded-md border border-white/10 bg-[#16161F] px-2.5 py-1 text-[12px]"
                    style={mono}
                    onClick={() => {
                      if (s.is_secret && !revealedKeys.has(s.key)) {
                        setRevealedKeys((prev) => new Set(prev).add(s.key));
                      }
                    }}
                  >
                    {s.is_secret && !revealedKeys.has(s.key) ? "••••••••••••" : s.value}
                  </div>
                  <button
                    onClick={() => startEdit(s.key, s.value)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-[#16161F] text-[12px] text-white/40 transition hover:border-orange-500/50 hover:text-orange-400"
                  >
                    ✎
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feature Flags shortcut */}
      <div className="rounded-[10px] border border-white/[0.06] bg-[#0F0F17] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium">Feature Flags</p>
            <p className="text-[12px] text-white/40 mt-0.5">Gerencie os feature flags na página dedicada</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/flags")}
            className="gap-2 border-white/10 bg-transparent text-[12px] text-white/65 hover:bg-[#16161F] hover:text-orange-400"
          >
            <Flag className="h-4 w-4" /> Gerenciar Flags
          </Button>
        </div>
      </div>
    </div>
  );
}
