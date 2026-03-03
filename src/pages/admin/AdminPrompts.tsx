import { useState } from "react";
import { useAdminPrompts, useAdminPromptDetail, useDeletePrompt, useAdminSaasSpecs, useAdminSpecDetail, useDeleteSpec } from "@/hooks/admin/useAdminData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, ChevronLeft, ChevronRight, Trash2, Eye, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DestinoBadge } from "@/components/admin/Badges";
import "./admin.css";

const perPage = 20;

export default function AdminPrompts() {
  const [mainTab, setMainTab] = useState<"prompts" | "specs">("prompts");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Prompts e Specs</h1>
        <div className="adm-tabs">
          {(["prompts", "specs"] as const).map((t) => (
            <button key={t} onClick={() => setMainTab(t)} className={`adm-tab ${mainTab === t ? "active" : ""}`}>
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
    try { await deletePrompt.mutateAsync(id); toast({ title: "Prompt excluído" }); setSelectedId(null); }
    catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  return (
    <>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button className="adm-btn outline" onClick={handleExport} disabled={!prompts?.length}><Download size={14} /> CSV</button>
        <div className="filter-input" style={{ width: 280 }}>
          <Search size={14} />
          <input placeholder="Buscar tarefa ou especialidade..." value={search} onChange={(e) => handleSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead><tr>
            {["Usuário", "Org", "Especialidade", "Tarefa", "Destino", "Rating", "Tokens", "Data", ""].map((h) => <th key={h}>{h}</th>)}
          </tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={9} style={{ textAlign: "center", padding: "40px 16px", color: "var(--adm-text-soft)" }}>Carregando...</td></tr>}
            {prompts?.map((p, i) => (
              <tr key={`${p.id}-${i}`} className="clickable" onClick={() => setSelectedId(p.id!)}>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{p.user_name || "—"}</div>
                  <div style={{ fontSize: 10, fontFamily: "var(--adm-mono)", color: "var(--adm-text-soft)" }}>{p.user_email}</div>
                </td>
                <td style={{ color: "var(--adm-text-soft)" }}>{p.org_name || "—"}</td>
                <td>{p.especialidade || "—"}</td>
                <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.tarefa || "—"}</td>
                <td><DestinoBadge destino={p.destino} /></td>
                <td>{p.rating ? <span className="rating-num">{p.rating}</span> : <span style={{ color: "var(--adm-text-soft)" }}>—</span>}</td>
                <td style={{ fontFamily: "var(--adm-mono)", fontSize: 11, color: "var(--adm-text-soft)" }}>{p.tokens_consumed ?? "—"}</td>
                <td style={{ fontFamily: "var(--adm-mono)", fontSize: 11, color: "var(--adm-text-soft)" }}>{p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : "—"}</td>
                <td>
                  <button className="adm-btn ghost" onClick={(e) => { e.stopPropagation(); setSelectedId(p.id!); }}><Eye size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pag">
          <span className="pag-info">Página {page + 1}</span>
          <div className="pag-btns">
            <button className="pag-btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={14} /></button>
            <button className="pag-btn" disabled={!prompts || prompts.length < perPage} onClick={() => setPage((p) => p + 1)}><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedId && !!detail} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="border-[var(--adm-border)] bg-[var(--adm-surface)] text-[var(--adm-text)] max-w-[660px] rounded-[18px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle style={{ fontSize: 16, fontWeight: 800 }}>Detalhes do Prompt</DialogTitle></DialogHeader>
          {detail && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="meta-grid">
                {[
                  ["Especialidade", detail.especialidade], ["Persona", detail.persona], ["Tarefa", detail.tarefa],
                  ["Objetivo", detail.objetivo], ["Formato", detail.formato], ["Destino", detail.destino],
                  ["Categoria", detail.categoria], ["Rating", detail.rating], ["Tokens", detail.tokens_consumed],
                  ["Favorito", detail.is_favorite ? "Sim" : "Não"], ["Tags", detail.tags?.join(", ") || "—"],
                  ["Data", new Date(detail.created_at).toLocaleString("pt-BR")],
                ].map(([label, value]) => (
                  <div key={label as string}><div className="meta-lbl">{label}</div><div className="meta-val">{String(value || "—")}</div></div>
                ))}
              </div>
              {detail.contexto && <div><div className="meta-lbl">Contexto</div><div className="code-box">{detail.contexto}</div></div>}
              {detail.restricoes && <div><div className="meta-lbl">Restrições</div><div className="code-box">{detail.restricoes}</div></div>}
              {detail.referencias && <div><div className="meta-lbl">Referências</div><div className="code-box">{detail.referencias}</div></div>}
              {detail.rating_comment && <div><div className="meta-lbl">Comentário Rating</div><div className="code-box">{detail.rating_comment}</div></div>}
              <div><div className="meta-lbl">Prompt Gerado</div><div className="code-box">{detail.prompt_gerado}</div></div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="adm-btn danger" onClick={() => handleDelete(detail.id)}><Trash2 size={14} /> Excluir Prompt</button>
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
    try { await deleteSpec.mutateAsync(id); toast({ title: "Spec excluída" }); setSelectedId(null); }
    catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  return (
    <>
      <div className="table-card">
        <table>
          <thead><tr>
            {["Usuário", "Projeto", "Frontend", "Backend", "DB", "Revenue", "Rating", "Data", ""].map((h) => <th key={h}>{h}</th>)}
          </tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={9} style={{ textAlign: "center", padding: "40px 16px", color: "var(--adm-text-soft)" }}>Carregando...</td></tr>}
            {specs?.map((s) => (
              <tr key={s.id} className="clickable" onClick={() => setSelectedId(s.id!)}>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{s.user_name || "—"}</div>
                  <div style={{ fontSize: 10, fontFamily: "var(--adm-mono)", color: "var(--adm-text-soft)" }}>{s.user_email}</div>
                </td>
                <td>{s.project_name || "—"}</td>
                <td style={{ fontSize: 11, color: "var(--adm-text-soft)" }}>{s.stack_frontend || "—"}</td>
                <td style={{ fontSize: 11, color: "var(--adm-text-soft)" }}>{s.stack_backend || "—"}</td>
                <td style={{ fontSize: 11, color: "var(--adm-text-soft)" }}>{s.stack_database || "—"}</td>
                <td style={{ fontSize: 11, color: "var(--adm-text-soft)" }}>{s.revenue_model || "—"}</td>
                <td>{s.rating ? <span className="rating-num">{s.rating}</span> : <span style={{ color: "var(--adm-text-soft)" }}>—</span>}</td>
                <td style={{ fontFamily: "var(--adm-mono)", fontSize: 11, color: "var(--adm-text-soft)" }}>{s.created_at ? new Date(s.created_at).toLocaleDateString("pt-BR") : "—"}</td>
                <td><button className="adm-btn ghost"><Eye size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pag">
          <span className="pag-info">Página {page + 1}</span>
          <div className="pag-btns">
            <button className="pag-btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={14} /></button>
            <button className="pag-btn" disabled={!specs || specs.length < perPage} onClick={() => setPage((p) => p + 1)}><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedId && !!detail} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="border-[var(--adm-border)] bg-[var(--adm-surface)] text-[var(--adm-text)] max-w-[660px] rounded-[18px] max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle style={{ fontSize: 16, fontWeight: 800 }}>Detalhes da Spec — {detail?.project_name || "Sem nome"}</DialogTitle></DialogHeader>
          {detail && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="meta-grid">
                {[["Projeto", detail.project_name], ["Rating", detail.rating], ["Favorito", detail.is_favorite ? "Sim" : "Não"], ["Data", new Date(detail.created_at).toLocaleString("pt-BR")]].map(([label, value]) => (
                  <div key={label as string}><div className="meta-lbl">{label}</div><div className="meta-val">{String(value || "—")}</div></div>
                ))}
              </div>
              {detail.rating_comment && <div><div className="meta-lbl">Comentário</div><div className="code-box">{detail.rating_comment}</div></div>}
              <div><div className="meta-lbl">Answers (JSON)</div><div className="code-box">{JSON.stringify(detail.answers, null, 2)}</div></div>
              <div><div className="meta-lbl">Spec (Markdown)</div><div className="code-box">{detail.spec_md}</div></div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="adm-btn danger" onClick={() => handleDelete(detail.id)}><Trash2 size={14} /> Excluir Spec</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
