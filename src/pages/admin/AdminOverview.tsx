import {
  useAdminKpis, useAdminRecentAudit,
} from "@/hooks/admin/useAdminOverview";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Users, Building2, CreditCard, DollarSign,
  Activity, AlertTriangle, FileText, Zap,
  CheckCircle2, XCircle, ArrowRight, Clock,
  TrendingUp, Shield,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import "./admin.css";

// ── Admin-only hooks (platform-wide) ──

function usePaymentFailures() {
  return useQuery({
    queryKey: ["admin-payment-failures"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("billing_invoices")
        .select("*", { count: "exact", head: true })
        .not("status", "eq", "paid");
      if (error) throw error;
      return count ?? 0;
    },
  });
}

function useStripeSyncStatus() {
  return useQuery({
    queryKey: ["admin-stripe-sync"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stripe_sync_log")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      const lastSync = data?.[0]?.created_at;
      return {
        lastSync,
        isHealthy: lastSync ? (Date.now() - new Date(lastSync).getTime()) < 24 * 60 * 60 * 1000 : false,
      };
    },
  });
}

function useRecentAuditErrors() {
  return useQuery({
    queryKey: ["admin-audit-errors-24h"],
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const errors = data?.filter(l => l.action.includes("delete") || l.action.includes("error")) ?? [];
      return { total: data?.length ?? 0, errors: errors.length };
    },
  });
}

// Platform-wide credit stats
function usePlatformCreditStats() {
  return useQuery({
    queryKey: ["admin-platform-credits"],
    queryFn: async () => {
      // Total credits remaining across all orgs
      const { data: orgs, error: orgsError } = await supabase
        .from("organizations")
        .select("plan_credits_total, plan_credits_used, bonus_credits_total, bonus_credits_used");
      if (orgsError) throw orgsError;

      let totalRemaining = 0;
      let totalPlanCredits = 0;
      (orgs ?? []).forEach((o: any) => {
        const planRem = Math.max(0, (o.plan_credits_total ?? 0) - (o.plan_credits_used ?? 0));
        const bonusRem = Math.max(0, (o.bonus_credits_total ?? 0) - (o.bonus_credits_used ?? 0));
        totalRemaining += planRem + bonusRem;
        totalPlanCredits += o.plan_credits_total ?? 0;
      });

      return { totalRemaining, totalPlanCredits };
    },
  });
}

// Platform-wide credit consumption today
function usePlatformCreditsToday() {
  return useQuery({
    queryKey: ["admin-platform-credits-today"],
    queryFn: async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("amount")
        .lt("amount", 0)
        .gte("created_at", todayStart.toISOString());
      if (error) throw error;
      return (data ?? []).reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
    },
  });
}

// Platform-wide recent credit transactions
function usePlatformRecentTransactions(limit = 10) {
  return useQuery({
    queryKey: ["admin-platform-transactions", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── Components ──

function KpiCard({
  icon: Icon,
  label,
  value,
  delta,
  color,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  delta?: string;
  color: string;
  loading?: boolean;
}) {
  return (
    <div className="kpi-card">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${color}15`, display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={18} style={{ color }} />
        </div>
        <span className="kpi-label" style={{ marginBottom: 0 }}>{label}</span>
      </div>
      <div className="kpi-value">{loading ? "—" : value}</div>
      {delta && <div className="kpi-delta">{delta}</div>}
      <div className="kpi-bar" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
    </div>
  );
}

function StatusCard({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="kpi-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Icon size={16} style={{ color: "var(--adm-accent)", opacity: .7 }} />
        <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

function getActivityBadge(action: string) {
  if (action.includes("insert") || action.includes("create")) return "insert";
  if (action.includes("update")) return "update";
  if (action.includes("delete")) return "delete";
  return "";
}

// ── Main ──

export default function AdminOverview() {
  const navigate = useNavigate();

  // Platform-wide KPIs (admin RPC)
  const { data: kpis, isLoading: kpisLoading } = useAdminKpis();

  // Platform-wide data (direct queries with admin RLS)
  const { data: platformCredits, isLoading: creditsLoading } = usePlatformCreditStats();
  const { data: creditsToday } = usePlatformCreditsToday();
  const { data: platformTransactions } = usePlatformRecentTransactions(10);

  // Admin-specific queries
  const { data: auditInfo } = useRecentAuditErrors();
  const { data: paymentFailures } = usePaymentFailures();
  const { data: stripeSync } = useStripeSyncStatus();
  const { data: recentAudit } = useAdminRecentAudit(6);

  const mrr = kpis?.mrr_brl ?? 0;
  const mrrFormatted = `R$ ${(mrr / 100).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h1 className="page-title">Visão Geral</h1>

      {/* ── Row 1: Platform Status ── */}
      <div className="adm-section-header">Status da Plataforma</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <KpiCard
          icon={Users}
          label="Usuários"
          value={kpisLoading ? "—" : Number(kpis?.total_users ?? 0).toLocaleString("pt-BR")}
          delta={`+${kpis?.new_users_today ?? 0} hoje`}
          color="#8B5CF6"
          loading={kpisLoading}
        />
        <KpiCard
          icon={Building2}
          label="Organizações"
          value={kpisLoading ? "—" : Number(kpis?.total_orgs ?? 0).toLocaleString("pt-BR")}
          color="#6366F1"
          loading={kpisLoading}
        />
        <KpiCard
          icon={CreditCard}
          label="Assinaturas Ativas"
          value={kpisLoading ? "—" : String(kpis?.active_subs ?? 0)}
          delta="ativas"
          color="#06B6D4"
          loading={kpisLoading}
        />
        <KpiCard
          icon={DollarSign}
          label="MRR"
          value={kpisLoading ? "—" : mrrFormatted}
          delta="receita mensal recorrente"
          color="#34d399"
          loading={kpisLoading}
        />
      </div>

      {/* ── Row 2: Billing & Platform Stats ── */}
      <div className="adm-section-header">Faturamento & Plataforma</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <StatusCard icon={Activity} label="Stripe Status">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={`status-dot ${stripeSync?.isHealthy ? "green" : "red"}`} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {stripeSync?.isHealthy ? "Operacional" : "Atenção"}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "var(--adm-text-soft)", fontFamily: "var(--adm-mono)" }}>
            {stripeSync?.lastSync
              ? `Último sync: ${formatDistanceToNow(new Date(stripeSync.lastSync), { addSuffix: true, locale: ptBR })}`
              : "Sem sync registrado"}
          </div>
        </StatusCard>

        <StatusCard icon={TrendingUp} label="Créditos na Plataforma">
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--adm-mono)", color: "var(--adm-accent)" }}>
              {creditsLoading ? "—" : (platformCredits?.totalRemaining ?? 0).toLocaleString("pt-BR")}
            </span>
            <span style={{ fontSize: 12, color: "var(--adm-text-soft)" }}>restantes</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--adm-text-soft)" }}>
            Total alocado: {creditsLoading ? "—" : (platformCredits?.totalPlanCredits ?? 0).toLocaleString("pt-BR")} cotas
          </div>
        </StatusCard>

        <StatusCard icon={AlertTriangle} label="Falhas de Pagamento">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {(paymentFailures ?? 0) > 0 ? (
              <>
                <XCircle size={18} style={{ color: "var(--adm-red)" }} />
                <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--adm-mono)", color: "var(--adm-red)" }}>
                  {paymentFailures}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 size={18} style={{ color: "var(--adm-green)" }} />
                <span style={{ fontSize: 13, color: "var(--adm-green)", fontWeight: 600 }}>Sem falhas</span>
              </>
            )}
          </div>
          <span style={{ fontSize: 11, color: "var(--adm-text-soft)" }}>faturas não pagas</span>
        </StatusCard>

        <StatusCard icon={Shield} label="Planos Ativos">
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--adm-mono)" }}>
            {kpisLoading ? "—" : String(kpis?.active_subs ?? 0)}
          </div>
          <span style={{ fontSize: 11, color: "var(--adm-text-soft)" }}>assinaturas ativas na plataforma</span>
        </StatusCard>
      </div>

      {/* ── Row 3: Monitoring ── */}
      <div className="adm-section-header">Monitoramento</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <StatusCard icon={FileText} label="Logs (24h)">
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--adm-mono)" }}>
              {auditInfo?.total ?? "—"}
            </span>
            <span style={{ fontSize: 12, color: "var(--adm-text-soft)" }}>eventos</span>
          </div>
          {(auditInfo?.errors ?? 0) > 0 && (
            <div style={{ fontSize: 12, color: "var(--adm-red)", fontWeight: 600 }}>
              ⚠ {auditInfo?.errors} ações destrutivas
            </div>
          )}
          <button className="adm-btn outline" style={{ marginTop: 4, width: "100%" }} onClick={() => navigate("/admin/logs")}>
            Ver logs <ArrowRight size={12} />
          </button>
        </StatusCard>

        <StatusCard icon={Zap} label="Consumo Hoje (Plataforma)">
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--adm-mono)" }}>
              {(creditsToday ?? 0).toLocaleString("pt-BR")}
            </span>
            <span style={{ fontSize: 12, color: "var(--adm-text-soft)" }}>cotas consumidas</span>
          </div>
          <span style={{ fontSize: 11, color: "var(--adm-text-soft)" }}>todas as organizações</span>
        </StatusCard>

        <StatusCard icon={CreditCard} label="Prompts Gerados">
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--adm-mono)" }}>
            {kpisLoading ? "—" : Number(kpis?.total_prompts ?? 0).toLocaleString("pt-BR")}
          </div>
          <span style={{ fontSize: 11, color: "var(--adm-text-soft)" }}>total da plataforma</span>
        </StatusCard>

        <StatusCard icon={FileText} label="Specs Criadas">
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--adm-mono)" }}>
            {kpisLoading ? "—" : Number(kpis?.total_specs ?? 0).toLocaleString("pt-BR")}
          </div>
          <span style={{ fontSize: 11, color: "var(--adm-text-soft)" }}>total da plataforma</span>
        </StatusCard>
      </div>

      {/* ── Usage Table (Platform-wide) ── */}
      <div className="adm-section-header">Últimos Consumos (Plataforma)</div>
      <div className="table-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderBottom: "1px solid var(--adm-border)" }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Histórico de Créditos — Todas as Orgs</span>
        </div>
        <table>
          <thead><tr>
            {["Origem", "Descrição", "Qtd", "Tipo", "Saldo", "Quando"].map(h => <th key={h}>{h}</th>)}
          </tr></thead>
          <tbody>
            {platformTransactions && platformTransactions.length > 0 ? platformTransactions.map((tx: any) => (
              <tr key={tx.id}>
                <td>
                  <span className={`adm-badge ${tx.amount < 0 ? "delete" : "insert"}`} style={{ fontSize: 10 }}>
                    {tx.origin}
                  </span>
                </td>
                <td style={{ fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {tx.description ?? "—"}
                </td>
                <td style={{ fontFamily: "var(--adm-mono)", fontSize: 12, fontWeight: 600, color: tx.amount < 0 ? "var(--adm-red)" : "var(--adm-green)" }}>
                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                </td>
                <td style={{ fontSize: 11, color: "var(--adm-text-soft)" }}>
                  {tx.is_bonus ? "Bônus" : "Plano"}
                </td>
                <td style={{ fontFamily: "var(--adm-mono)", fontSize: 12 }}>
                  {tx.balance_after ?? "—"}
                </td>
                <td style={{ fontSize: 11, fontFamily: "var(--adm-mono)", color: "var(--adm-text-soft)" }}>
                  {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true, locale: ptBR })}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "32px 16px", color: "var(--adm-text-soft)" }}>Nenhum consumo registrado</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Audit Log Table ── */}
      <div className="adm-section-header">Atividade Recente</div>
      <div className="table-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderBottom: "1px solid var(--adm-border)" }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Últimos Eventos</span>
          <button className="adm-btn outline" onClick={() => navigate("/admin/logs")}>Ver todos →</button>
        </div>
        <table>
          <thead><tr>
            {["Ação", "Recurso", "Quando"].map((h) => <th key={h}>{h}</th>)}
          </tr></thead>
          <tbody>
            {recentAudit?.map((log) => (
              <tr key={log.id}>
                <td>
                  <span className={`adm-badge ${getActivityBadge(log.action)}`} style={{ fontSize: 10 }}>
                    {log.action.split(".").pop()}
                  </span>
                </td>
                <td style={{ fontFamily: "var(--adm-mono)", fontSize: 12, color: "var(--adm-accent)" }}>
                  {log.resource_type ?? "—"}
                </td>
                <td style={{ fontSize: 11, fontFamily: "var(--adm-mono)", color: "var(--adm-text-soft)" }}>
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                </td>
              </tr>
            ))}
            {(!recentAudit || recentAudit.length === 0) && (
              <tr><td colSpan={3} style={{ textAlign: "center", padding: "32px 16px", color: "var(--adm-text-soft)" }}>Nenhuma atividade</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
