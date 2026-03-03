import { useState } from "react";
import { useAdminPrompts, useAdminPromptDetail, useDeletePrompt, useAdminSaasSpecs, useAdminSpecDetail, useDeleteSpec } from "@/hooks/admin/useAdminData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, ChevronLeft, ChevronRight, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const perPage = 20;

export default function AdminPrompts() {
  const [mainTab, setMainTab] = useState<"prompts" | "specs">("prompts");

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Prompts e Specs</h2>
        <div className="flex gap-1 rounded-lg bg-[#16161F] p-1">
          {(["prompts", "specs"] as const).map((t) => (
            <button key={t} onClick={() => setMainTab(t)}
              className={`rounded-md px-3 py-1 text-[11px] font-medium transition ${mainTab === t ? "bg-orange-500/15 text-orange-400" : "text-white/50 hover:text-white/80"}`}>
              {t === "prompts" ? "Prompts" : "SaaS Specs"}
            </button>
          ))}
        </div>
      </div>
      {mainTab === "prompts" ? <PromptsTab /> : <SpecsTab />}
    </div>
  );
}

function PromptsTab() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { data: prompts, isLoading } = useAdminPrompts(page, debouncedSearch);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: detail } = useAdminPromptDetail(selectedId);
  const deletePrompt = useDeletePrompt();
  const { toast } = useToast();

  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout((window as any).__adminPromptSearch);
    (window as any).__adminPromptSearch = setTimeout(() => { setDebouncedSearch(v); setPage(0); }, 300);
  };

  const handleExport = () => {
    if (!prompts?.length) return;
    const headers = ["ID", "Usuário", "Email", "Especialidade", "Destino", "Rating", "Tokens", "Criado em"];
    const rows = prompts.map((p) => [p.id, p.user_name || "", p.user_email, p.especialidade || "", p.destino || "", p.rating || "", p.tokens_consumed || 0, p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : ""]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `prompts_${new Date().toISOString().split("T")[0]}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este prompt permanentemente?")) return;
    try {
      await deletePrompt.mutateAsync(id);
      toast({ title: "Prompt excluído" });
      setSelectedId(null);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={handleExport} disabled={!prompts?.length}
          className="gap-2 border-white/10 bg-transparent text-[12px] text-white/65 hover:bg-[#16161F]">
          <Download className="h-3.5 w-3.5" /> CSV
        </Button>
        <Input placeholder="Buscar tarefa ou especialidade..." value={search} onChange={(e) => handleSearch(e.target.value)}
          className="w-64 border-white/10 bg-[#16161F] text-[13px] text-[#E8E6F0] placeholder:text-white/30" />
      </div>

      <div className="overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0F0F17]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["Usuário", "Org", "Especialidade", "Tarefa", "Destino", "Rating", "Tokens", "Data", ""].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-white/40">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={9} className="px-5 py-10 text-center text-[12px] text-white/30">Carregando...</td></tr>}
            {prompts?.map((p, i) => (
              <tr key={`${p.id}-${i}`} className="border-b border-white/[0.06] last:border-0 hover:bg-[#16161F] transition cursor-pointer"
                onClick={() => setSelectedId(p.id!)}>
                <td className="px-4 py-3">
                  <div className="text-[12px] font-medium">{p.user_name || "—"}</div>
                  <div className="text-[10px] text-white/40" style={mono}>{p.user_email}</div>
                </td>
                <td className="px-4 py-3 text-[12px] text-white/65">{p.org_name || "—"}</td>
                <td className="px-4 py-3 text-[12px] text-white/65">{p.especialidade || "—"}</td>
                <td className="px-4 py-3 text-[12px] text-white/65 max-w-[160px] truncate">{p.tarefa || "—"}</td>
                <td className="px-4 py-3">{p.destino && <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px]">{p.destino}</span>}</td>
                <td className="px-4 py-3 text-[12px] text-white/65" style={mono}>{p.rating ?? "—"}</td>
                <td className="px-4 py-3 text-[11px] text-white/40" style={mono}>{p.tokens_consumed ?? "—"}</td>
                <td className="px-4 py-3 text-[11px] text-white/40" style={mono}>{p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : "—"}</td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/30 hover:text-orange-400" onClick={(e) => { e.stopPropagation(); setSelectedId(p.id!); }}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-[11px] text-white/40">Pág. <span className="font-medium text-white/65">{page + 1}</span></p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="h-7 border-white/10 bg-transparent text-[12px] text-white/65 hover:bg-[#16161F]"><ChevronLeft className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" size="sm" disabled={!prompts || prompts.length < perPage} onClick={() => setPage((p) => p + 1)} className="h-7 border-white/10 bg-transparent text-[12px] text-white/65 hover:bg-[#16161F]"><ChevronRight className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      <Dialog open={!!selectedId && !!detail} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="max-w-2xl border-white/[0.06] bg-[#0F0F17] text-[#E8E6F0] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Detalhes do Prompt</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                {[
                  ["Especialidade", detail.especialidade],
                  ["Persona", detail.persona],
                  ["Tarefa", detail.tarefa],
                  ["Objetivo", detail.objetivo],
                  ["Formato", detail.formato],
                  ["Destino", detail.destino],
                  ["Categoria", detail.categoria],
                  ["Rating", detail.rating],
                  ["Tokens", detail.tokens_consumed],
                  ["Favorito", detail.is_favorite ? "Sim" : "Não"],
                  ["Tags", detail.tags?.join(", ") || "—"],
                  ["Data", new Date(detail.created_at).toLocaleString("pt-BR")],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <div className="text-white/40 text-[10px] uppercase tracking-wider">{label}</div>
                    <div className="text-white/80 mt-0.5" style={mono}>{String(value || "—")}</div>
                  </div>
                ))}
              </div>
              {detail.contexto && <div><div className="text-[10px] text-white/40 uppercase mb-1">Contexto</div><div className="rounded-md bg-[#16161F] p-3 text-[11px] text-white/70 whitespace-pre-wrap" style={mono}>{detail.contexto}</div></div>}
              {detail.restricoes && <div><div className="text-[10px] text-white/40 uppercase mb-1">Restrições</div><div className="rounded-md bg-[#16161F] p-3 text-[11px] text-white/70 whitespace-pre-wrap" style={mono}>{detail.restricoes}</div></div>}
              {detail.referencias && <div><div className="text-[10px] text-white/40 uppercase mb-1">Referências</div><div className="rounded-md bg-[#16161F] p-3 text-[11px] text-white/70 whitespace-pre-wrap" style={mono}>{detail.referencias}</div></div>}
              {detail.rating_comment && <div><div className="text-[10px] text-white/40 uppercase mb-1">Comentário Rating</div><div className="rounded-md bg-[#16161F] p-3 text-[11px] text-white/70" style={mono}>{detail.rating_comment}</div></div>}
              <div>
                <div className="text-[10px] text-white/40 uppercase mb-1">Prompt Gerado</div>
                <div className="rounded-md bg-[#16161F] p-3 text-[11px] text-white/70 whitespace-pre-wrap max-h-[300px] overflow-y-auto" style={mono}>{detail.prompt_gerado}</div>
              </div>
              <div className="flex justify-end">
                <Button variant="destructive" size="sm" onClick={() => handleDelete(detail.id)} className="gap-2 text-[12px]">
                  <Trash2 className="h-3.5 w-3.5" /> Excluir Prompt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function SpecsTab() {
  const [page, setPage] = useState(0);
  const { data: specs, isLoading } = useAdminSaasSpecs(page);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: detail } = useAdminSpecDetail(selectedId);
  const deleteSpec = useDeleteSpec();
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta spec permanentemente?")) return;
    try {
      await deleteSpec.mutateAsync(id);
      toast({ title: "Spec excluída" });
      setSelectedId(null);
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
              {["Usuário", "Projeto", "Frontend", "Backend", "DB", "Revenue", "Rating", "Data", ""].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-white/40">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={9} className="px-5 py-10 text-center text-[12px] text-white/30">Carregando...</td></tr>}
            {specs?.map((s) => (
              <tr key={s.id} className="border-b border-white/[0.06] last:border-0 hover:bg-[#16161F] transition cursor-pointer"
                onClick={() => setSelectedId(s.id!)}>
                <td className="px-4 py-3">
                  <div className="text-[12px] font-medium">{s.user_name || "—"}</div>
                  <div className="text-[10px] text-white/40" style={mono}>{s.user_email}</div>
                </td>
                <td className="px-4 py-3 text-[12px] text-white/65">{s.project_name || "—"}</td>
                <td className="px-4 py-3 text-[11px] text-white/50">{s.stack_frontend || "—"}</td>
                <td className="px-4 py-3 text-[11px] text-white/50">{s.stack_backend || "—"}</td>
                <td className="px-4 py-3 text-[11px] text-white/50">{s.stack_database || "—"}</td>
                <td className="px-4 py-3 text-[11px] text-white/50">{s.revenue_model || "—"}</td>
                <td className="px-4 py-3 text-[12px] text-white/65" style={mono}>{s.rating ?? "—"}</td>
                <td className="px-4 py-3 text-[11px] text-white/40" style={mono}>{s.created_at ? new Date(s.created_at).toLocaleDateString("pt-BR") : "—"}</td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/30 hover:text-orange-400"><Eye className="h-3.5 w-3.5" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="h-7 border-white/10 bg-transparent text-[12px] text-white/65 hover:bg-[#16161F]"><ChevronLeft className="h-3.5 w-3.5" /></Button>
        <span className="text-[11px] text-white/40" style={mono}>Pág. {page + 1}</span>
        <Button variant="outline" size="sm" disabled={!specs || specs.length < perPage} onClick={() => setPage((p) => p + 1)} className="h-7 border-white/10 bg-transparent text-[12px] text-white/65 hover:bg-[#16161F]"><ChevronRight className="h-3.5 w-3.5" /></Button>
      </div>

      <Dialog open={!!selectedId && !!detail} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="max-w-2xl border-white/[0.06] bg-[#0F0F17] text-[#E8E6F0] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Detalhes da Spec — {detail?.project_name || "Sem nome"}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                {[
                  ["Projeto", detail.project_name],
                  ["Rating", detail.rating],
                  ["Favorito", detail.is_favorite ? "Sim" : "Não"],
                  ["Data", new Date(detail.created_at).toLocaleString("pt-BR")],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <div className="text-white/40 text-[10px] uppercase tracking-wider">{label}</div>
                    <div className="text-white/80 mt-0.5" style={mono}>{String(value || "—")}</div>
                  </div>
                ))}
              </div>
              {detail.rating_comment && <div><div className="text-[10px] text-white/40 uppercase mb-1">Comentário</div><div className="rounded-md bg-[#16161F] p-3 text-[11px] text-white/70" style={mono}>{detail.rating_comment}</div></div>}
              <div>
                <div className="text-[10px] text-white/40 uppercase mb-1">Answers (JSON)</div>
                <div className="rounded-md bg-[#16161F] p-3 text-[11px] text-white/70 whitespace-pre-wrap max-h-[200px] overflow-y-auto" style={mono}>{JSON.stringify(detail.answers, null, 2)}</div>
              </div>
              <div>
                <div className="text-[10px] text-white/40 uppercase mb-1">Spec (Markdown)</div>
                <div className="rounded-md bg-[#16161F] p-3 text-[11px] text-white/70 whitespace-pre-wrap max-h-[300px] overflow-y-auto" style={mono}>{detail.spec_md}</div>
              </div>
              <div className="flex justify-end">
                <Button variant="destructive" size="sm" onClick={() => handleDelete(detail.id)} className="gap-2 text-[12px]">
                  <Trash2 className="h-3.5 w-3.5" /> Excluir Spec
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
