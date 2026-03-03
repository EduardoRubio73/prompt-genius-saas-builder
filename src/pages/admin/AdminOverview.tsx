import {
  useAdminKpis, useAdminRecentUsers, useAdminRecentAudit, useAdminSessionChart,
} from "@/hooks/admin/useAdminOverview";
import { useAdminSettings, useAdminFeatureFlags } from "@/hooks/admin/useAdminData";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PlanBadge, StatusBadge } from "@/components/admin/Badges";
import "./admin.css";

const kpiConfig = [
  { key: "total_users", label: "Usuários Total", color: "#34d399", delta: (d: any) => d ? `+${d.new_users_today ?? 0} hoje` : "" },
  { key: "total_orgs", label: "Orgs Ativas", color: "#60a5fa", delta: () => "" },
  { key: "mrr_brl", label: "MRR", color: "#f05a28", format: (v: number) => `R$${(v / 100).toLocaleString("pt-BR")}`, delta: () => "" },
  { key: "total_prompts", label: "Prompts Gerados", color: "#a78bfa", delta: () => "total" },
  { key: "tokens_this_month", label: "Tokens Mês", color: "#fbbf24", format: (v: number) => v > 999999 ? `${(v / 1000000).toFixed(1)}M` : v > 999 ? `${(v / 1000).toFixed(1)}k` : String(v), delta: () => "este mês" },
];

function getActivityBadge(action: string) {
  if (action.includes("insert") || action.includes("create")) return "insert";
  if (action.includes("update")) return "update";
  if (action.includes("delete")) return "delete";
  return "";
}

export default function AdminOverview() {
  const navigate = useNavigate();
  const { data: kpis, isLoading: kpisLoading } = useAdminKpis();
  const { data: recentUsers } = useAdminRecentUsers(5);
  const { data: recentAudit } = useAdminRecentAudit(5);
  const { data: chartData } = useAdminSessionChart();
  const { data: aiSettings } = useAdminSettings("ai");
  const { data: flags } = useAdminFeatureFlags();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h1 className="page-title">Visão Geral</h1>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
        {kpiConfig.map((kpi) => {
          const val = kpis?.[kpi.key] ?? 0;
          const formatted = kpi.format ? kpi.format(val) : Number(val).toLocaleString("pt-BR");
          return (
            <div key={kpi.key} className="kpi-card">
              <div className="kpi-label">{kpi.label}</div>
              <div className="kpi-value">{kpisLoading ? "—" : formatted}</div>
              {kpi.delta(kpis) && <div className="kpi-delta">{kpi.delta(kpis)}</div>}
              <div className="kpi-bar" style={{ background: kpi.color }} />
            </div>
          );
        })}
      </div>

      {/* Users + Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div className="table-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderBottom: "1px solid var(--adm-border)" }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Usuários Recentes</span>
            <button className="adm-btn outline" onClick={() => navigate("/admin/users")}>Ver todos →</button>
          </div>
          <table>
            <thead><tr>
              {["Usuário", "Plano", "Prompts", "Status"].map((h) => <th key={h}>{h}</th>)}
            </tr></thead>
            <tbody>
              {recentUsers?.map((u) => (
                <tr key={u.user_id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.full_name || "—"}</div>
                    <div style={{ fontSize: 11, fontFamily: "var(--adm-mono)", color: "var(--adm-text-soft)" }}>{u.email}</div>
                  </td>
                  <td><PlanBadge tier={u.plan_tier} /></td>
                  <td style={{ fontFamily: "var(--adm-mono)", fontSize: 12 }}>{u.total_prompts ?? 0}</td>
                  <td><StatusBadge active={u.org_active !== false} labelTrue="ativo" labelFalse="inativo" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-card">
          <div style={{ padding: "16px", borderBottom: "1px solid var(--adm-border)", fontSize: 14, fontWeight: 700 }}>
            Atividade Recente
          </div>
          <div>
            {recentAudit?.map((log) => (
              <div key={log.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 16px", borderBottom: "1px solid var(--adm-border)" }}>
                <span className={`adm-badge ${getActivityBadge(log.action)}`} style={{ fontSize: 10, marginTop: 2 }}>
                  {log.action.split(".").pop()}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12 }}><strong style={{ color: "var(--adm-accent)" }}>{log.resource_type}</strong></div>
                  <div style={{ fontSize: 11, fontFamily: "var(--adm-mono)", color: "var(--adm-text-soft)" }}>
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                  </div>
                </div>
              </div>
            ))}
            {(!recentAudit || recentAudit.length === 0) && (
              <div style={{ padding: "32px 16px", textAlign: "center", fontSize: 12, color: "var(--adm-text-soft)" }}>Nenhuma atividade</div>
            )}
          </div>
        </div>
      </div>

      {/* AI Config + Flags + Chart */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="table-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderBottom: "1px solid var(--adm-border)" }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Configurações de IA</span>
            <button className="adm-btn outline" onClick={() => navigate("/admin/ai-config")}>Editar</button>
          </div>
          <div>
            {aiSettings?.slice(0, 5).map((s) => (
              <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", borderBottom: "1px solid var(--adm-border)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontFamily: "var(--adm-mono)", color: "var(--adm-accent)" }}>{s.key}</div>
                  <div style={{ fontSize: 12, color: "var(--adm-text-soft)", marginTop: 2 }}>{s.description || "—"}</div>
                </div>
                <div style={{ fontFamily: "var(--adm-mono)", fontSize: 12, padding: "4px 10px", borderRadius: 7, background: "var(--adm-bg)", border: "1px solid var(--adm-border)" }}>
                  {s.is_secret ? "••••••••••••" : s.value}
                </div>
              </div>
            ))}
            {(!aiSettings || aiSettings.length === 0) && (
              <div style={{ padding: "32px 16px", textAlign: "center", fontSize: 12, color: "var(--adm-text-soft)" }}>Nenhuma configuração</div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="table-card">
            <div style={{ padding: "16px", borderBottom: "1px solid var(--adm-border)", fontSize: 14, fontWeight: 700 }}>Feature Flags</div>
            <div>
              {flags?.slice(0, 4).map((f) => (
                <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--adm-border)" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</div>
                    <div style={{ fontSize: 12, color: "var(--adm-text-soft)", marginTop: 2 }}>{f.description || f.flag}</div>
                  </div>
                  <div className={`adm-toggle ${f.enabled ? "on" : "off"}`}>
                    <div className="adm-toggle-dot" />
                  </div>
                </div>
              ))}
              {(!flags || flags.length === 0) && (
                <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 12, color: "var(--adm-text-soft)" }}>Nenhuma flag</div>
              )}
            </div>
          </div>

          <div className="table-card">
            <div style={{ padding: "16px", borderBottom: "1px solid var(--adm-border)", fontSize: 14, fontWeight: 700 }}>Sessões (7 dias)</div>
            <div style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "end", gap: 6, height: 80 }}>
                {chartData?.map((d, i) => {
                  const max = Math.max(...(chartData?.map((x) => x.count) ?? [1]), 1);
                  const h = (d.count / max) * 100;
                  const isToday = i === (chartData?.length ?? 0) - 1;
                  return (
                    <div key={d.day} style={{ flex: 1, height: `${Math.max(h, 4)}%`, borderRadius: "4px 4px 0 0", background: isToday ? "var(--adm-accent)" : "rgba(240,90,40,.2)", transition: "height .5s" }} title={`${d.count} sessões — ${d.day}`} />
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, fontFamily: "var(--adm-mono)", color: "var(--adm-text-soft)" }}>
                <span>{chartData?.[0]?.day}</span>
                <span>{chartData?.[chartData.length - 1]?.day}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
