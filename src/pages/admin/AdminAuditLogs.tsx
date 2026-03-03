import { useState } from "react";
import { useAdminAuditLogs } from "@/hooks/admin/useAdminData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./admin.css";

const filterOptions = [
  { value: "all", label: "Todos" },
  { value: "prompt_memory", label: "Prompts" },
  { value: "saas_specs", label: "SaaS Specs" },
  { value: "billing", label: "Billing" },
  { value: "admin_settings", label: "Admin Settings" },
];

function getActionBadge(action: string) {
  if (action.includes("insert")) return "insert";
  if (action.includes("update")) return "update";
  if (action.includes("delete")) return "delete";
  return "";
}

export default function AdminAuditLogs() {
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState("all");
  const { data: logs, isLoading } = useAdminAuditLogs(page, filter === "all" ? "" : filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Logs e Auditoria</h1>
        <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(0); }}>
          <SelectTrigger className="w-48" style={{ background: "var(--adm-surface)", border: "1px solid var(--adm-border)", borderRadius: 9, color: "var(--adm-text)", fontSize: 12 }}>
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent style={{ background: "var(--adm-surface)", border: "1px solid var(--adm-border)", color: "var(--adm-text)" }}>
            {filterOptions.map((o) => (
              <SelectItem key={o.value} value={o.value} style={{ fontSize: 12 }}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="table-card">
        <table>
          <thead><tr>
            {["Timestamp", "Ação", "Recurso", "ID", "User ID"].map((h) => <th key={h}>{h}</th>)}
          </tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--adm-text-soft)" }}>Carregando...</td></tr>}
            {logs?.map((log) => (
              <tr key={log.id}>
                <td style={{ fontFamily: "var(--adm-mono)", fontSize: 11, color: "var(--adm-text-soft)" }}>
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                </td>
                <td><span className={`adm-badge ${getActionBadge(log.action)}`}>{log.action}</span></td>
                <td>{log.resource_type || "—"}</td>
                <td style={{ fontFamily: "var(--adm-mono)", fontSize: 10, color: "var(--adm-text-soft)" }}>{log.resource_id?.slice(0, 12) || "—"}</td>
                <td style={{ fontFamily: "var(--adm-mono)", fontSize: 10, color: "var(--adm-text-soft)" }}>{log.user_id?.slice(0, 12) || "system"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pag">
          <span className="pag-info">Página {page + 1}</span>
          <div className="pag-btns">
            <button className="pag-btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={14} /> Anterior</button>
            <button className="pag-btn" disabled={!logs || logs.length < 50} onClick={() => setPage((p) => p + 1)}>Próximo <ChevronRight size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
