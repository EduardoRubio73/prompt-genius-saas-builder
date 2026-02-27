import {
  useAdminKpis,
  useAdminRecentUsers,
  useAdminRecentAudit,
  useAdminSessionChart,
} from "@/hooks/admin/useAdminOverview";
import { useAdminSettings, useAdminFeatureFlags } from "@/hooks/admin/useAdminData";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PlanBadge, StatusBadge } from "@/components/admin/Badges";
import { cn } from "@/lib/utils";

const kpiConfig = [
  { key: "total_users", label: "Usuários Total", color: "#22C55E", delta: (d: any) => d ? `+${d.new_users_today ?? 0} hoje` : "" },
  { key: "total_orgs", label: "Orgs Ativas", color: "#3B82F6", delta: () => "" },
  { key: "mrr_brl", label: "MRR", color: "#F97316", format: (v: number) => `R$${(v / 100).toLocaleString("pt-BR")}`, delta: () => "" },
  { key: "total_prompts", label: "Prompts Gerados", color: "#7C5CFC", delta: () => "total" },
  { key: "tokens_this_month", label: "Tokens Mês", color: "#EAB308", format: (v: number) => v > 999999 ? `${(v / 1000000).toFixed(1)}M` : v > 999 ? `${(v / 1000).toFixed(1)}k` : String(v), delta: () => "este mês" },
];

function getActivityDotClass(action: string) {
  if (action.includes("insert") || action.includes("create")) return "bg-green-500 shadow-[0_0_6px_#22C55E]";
  if (action.includes("update")) return "bg-blue-500 shadow-[0_0_6px_#3B82F6]";
  if (action.includes("delete")) return "bg-red-500 shadow-[0_0_6px_#EF4444]";
  if (action.includes("billing")) return "bg-orange-500 shadow-[0_0_6px_#F97316]";
  return "bg-white/40";
}

export default function AdminOverview() {
  const navigate = useNavigate();
  const { data: kpis, isLoading: kpisLoading } = useAdminKpis();
  const { data: recentUsers } = useAdminRecentUsers(5);
  const { data: recentAudit } = useAdminRecentAudit(5);
  const { data: chartData } = useAdminSessionChart();
  const { data: aiSettings } = useAdminSettings("ai");
  const { data: flags } = useAdminFeatureFlags();

  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* KPI Grid */}
      <div className="grid grid-cols-5 gap-3.5">
        {kpiConfig.map((kpi, i) => {
          const val = kpis?.[kpi.key] ?? 0;
          const formatted = kpi.format ? kpi.format(val) : Number(val).toLocaleString("pt-BR");
          return (
            <div
              key={kpi.key}
              className="relative overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0F0F17] p-[18px_20px]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="text-[11px] uppercase tracking-[0.08em] text-white/40 mb-2">{kpi.label}</div>
              <div className="text-[26px] font-medium leading-none" style={mono}>
                {kpisLoading ? "—" : formatted}
              </div>
              {kpi.delta(kpis) && (
                <div className="mt-1.5 text-[11px] text-white/40">{kpi.delta(kpis)}</div>
              )}
              <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: kpi.color }} />
            </div>
          );
        })}
      </div>

      {/* Users + Activity */}
      <div className="grid grid-cols-[2fr_1fr] gap-5">
        {/* Recent Users */}
        <div className="overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0F0F17]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <span className="text-[13px] font-semibold">Usuários Recentes</span>
            <button
              onClick={() => navigate("/admin/users")}
              className="rounded-md border border-orange-500/30 px-2.5 py-1 text-[11px] text-orange-400 transition hover:bg-orange-500/10"
            >
              Ver todos →
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Usuário", "Plano", "Prompts", "Status"].map((h) => (
                  <th key={h} className="px-5 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-white/40">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentUsers?.map((u) => (
                <tr key={u.user_id} className="border-b border-white/[0.06] last:border-0 hover:bg-[#16161F] transition">
                  <td className="px-5 py-3">
                    <div className="text-[13px] font-medium">{u.full_name || "—"}</div>
                    <div className="text-[11px] text-white/40" style={mono}>{u.email}</div>
                  </td>
                  <td className="px-5 py-3"><PlanBadge tier={u.plan_tier} /></td>
                  <td className="px-5 py-3 text-[11px] text-white/65" style={mono}>{u.total_prompts ?? 0}</td>
                  <td className="px-5 py-3">
                    <StatusBadge active={u.org_active !== false} labelTrue="ativo" labelFalse="inativo" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Activity */}
        <div className="overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0F0F17]">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <span className="text-[13px] font-semibold">Atividade Recente</span>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {recentAudit?.map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-2.5 transition hover:bg-[#16161F]">
                <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${getActivityDotClass(log.action)}`} />
                <div>
                  <div className="text-[12.5px]">
                    <strong className="text-orange-300">{log.resource_type}</strong>{" "}
                    {log.action.split(".").pop()}
                  </div>
                  <div className="text-[11px] text-white/40" style={mono}>
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                  </div>
                </div>
              </div>
            ))}
            {(!recentAudit || recentAudit.length === 0) && (
              <div className="px-5 py-8 text-center text-[12px] text-white/30">Nenhuma atividade recente</div>
            )}
          </div>
        </div>
      </div>

      {/* AI Config + Flags + Chart */}
      <div className="grid grid-cols-2 gap-5">
        {/* AI Settings preview */}
        <div className="overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0F0F17]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <span className="text-[13px] font-semibold">Configurações de IA</span>
            <button
              onClick={() => navigate("/admin/ai-config")}
              className="rounded-md border border-orange-500/30 px-2.5 py-1 text-[11px] text-orange-400 transition hover:bg-orange-500/10"
            >
              Editar
            </button>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {aiSettings?.slice(0, 5).map((s) => (
              <div key={s.key} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex-1">
                  <div className="text-[12px] text-orange-300" style={mono}>{s.key}</div>
                  <div className="text-[12px] text-white/40 mt-0.5">{s.description || "—"}</div>
                </div>
                <div
                  className={`rounded-md border border-white/10 bg-[#16161F] px-2.5 py-1 text-[12px] ${s.is_secret ? "text-white/40" : ""}`}
                  style={mono}
                >
                  {s.is_secret ? "••••••••••••" : s.value}
                </div>
              </div>
            ))}
            {(!aiSettings || aiSettings.length === 0) && (
              <div className="px-5 py-8 text-center text-[12px] text-white/30">Nenhuma configuração</div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* Feature Flags */}
          <div className="overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0F0F17]">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <span className="text-[13px] font-semibold">Feature Flags</span>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {flags?.slice(0, 4).map((f) => (
                <div key={f.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <div className="text-[13px] font-medium">{f.label}</div>
                    <div className="text-[12px] text-white/40 mt-0.5">{f.description || f.flag}</div>
                  </div>
                  <div className={`h-2.5 w-2.5 rounded-full ${f.enabled ? "bg-green-500 shadow-[0_0_6px_#22C55E]" : "bg-white/20"}`} />
                </div>
              ))}
              {(!flags || flags.length === 0) && (
                <div className="px-5 py-6 text-center text-[12px] text-white/30">Nenhuma flag configurada</div>
              )}
            </div>
          </div>

          {/* Mini chart with tooltips */}
          <div className="overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0F0F17]">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <span className="text-[13px] font-semibold">Sessões (7 dias)</span>
            </div>
            <div className="px-5 py-4">
              <div className="relative">
                <div className="flex items-end gap-1.5" style={{ height: 80 }}>
                  {chartData?.map((d, i) => {
                    const max = Math.max(...(chartData?.map((x) => x.count) ?? [1]), 1);
                    const h = (d.count / max) * 100;
                    const isToday = i === (chartData?.length ?? 0) - 1;
                    return (
                      <div key={d.day} className="flex-1 relative group/bar">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/bar:flex flex-col items-center z-10 pointer-events-none">
                          <div className="bg-[#1C1C28] border border-white/10 rounded-md px-2 py-1 text-[10px] shadow-md whitespace-nowrap" style={mono}>
                            <span className="font-semibold text-orange-400">{d.count}</span> sessões
                            <br />
                            <span className="text-white/40">{d.day}</span>
                          </div>
                        </div>
                        <div
                          className={cn(
                            "w-full rounded-t transition-all duration-500 cursor-pointer hover:opacity-80",
                            isToday ? "bg-orange-500" : "bg-orange-500/20 hover:bg-orange-500/40"
                          )}
                          style={{ height: `${Math.max(h, 4)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                {/* Y-axis hints */}
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none -ml-1">
                  {[0, 1, 2].map((i) => {
                    const max = Math.max(...(chartData?.map((x) => x.count) ?? [0]), 1);
                    const val = Math.round(max * (1 - i / 2));
                    return (
                      <span key={i} className="text-[8px] text-white/30 -translate-x-full pr-1" style={mono}>
                        {val}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-white/40" style={mono}>
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
