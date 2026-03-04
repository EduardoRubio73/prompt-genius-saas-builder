import { cn } from "@/lib/utils";
import { Zap, Gift, Sparkles, FileCode, Layers, Rocket, Crown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface QuotaCardProps {
  planUsed: number;
  planTotal: number;
  bonusUsed: number;
  bonusTotal: number;
  totalRemaining: number;
  loading?: boolean;
}

const COST_PER_QUOTA = 0.87; // R$ per cota (best pack price)

const ACTION_COSTS = [
  { label: "Prompt", icon: Sparkles, cost: 1, color: "text-primary" },
  { label: "SaaS Spec", icon: FileCode, cost: 2, color: "text-accent" },
  { label: "Misto", icon: Layers, cost: 3, color: "text-secondary" },
  { label: "BUILD", icon: Rocket, cost: 5, color: "text-primary" },
];

function QuotaSection({
  label,
  icon: Icon,
  iconColor,
  used,
  total,
  subtitle,
}: {
  label: string;
  icon: React.ElementType;
  iconColor: string;
  used: number;
  total: number;
  subtitle?: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const remaining = Math.max(0, total - used);
  const barColor =
    pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-warning" : "bg-primary";

  return (
    <div className="rounded-xl border border-border/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", iconColor)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="text-[10px] text-muted-foreground">{pct}% utilizado</p>
        </div>
      </div>

      <div className="h-2 w-full rounded-full bg-border overflow-hidden mb-2">
        <div
          className={cn("h-full rounded-full transition-all duration-700", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-end justify-between">
        <p className="text-sm text-muted-foreground tabular-nums">
          <span className="text-foreground font-semibold">{used}</span> / {total} usadas
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          <span className="text-foreground font-semibold">{remaining}</span> restantes
        </p>
      </div>

      {subtitle && (
        <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}

export function QuotaCard({
  planUsed,
  planTotal,
  bonusUsed,
  bonusTotal,
  totalRemaining,
  loading = false,
}: QuotaCardProps) {
  const totalUsed = planUsed + bonusUsed;
  const economyValue = totalUsed * COST_PER_QUOTA;

  return (
    <div className="glass-card p-5 col-span-full sm:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Cotas do período
            </p>
            {!loading && (
              <p className="text-[11px] text-muted-foreground">
                <span className="text-foreground font-semibold">{totalRemaining}</span> cotas restantes no total
              </p>
            )}
          </div>
        </div>
        {!loading && totalRemaining <= 0 && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 uppercase tracking-wider">
            Esgotado
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <>
          {/* Plan + Bonus cards side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <QuotaSection
              label="Cotas do Plano"
              icon={Zap}
              iconColor="bg-primary/15 text-primary"
              used={planUsed}
              total={planTotal}
              subtitle="Renovam mensalmente"
            />
            <QuotaSection
              label="Cotas Bônus"
              icon={Gift}
              iconColor="bg-accent/15 text-accent"
              used={bonusUsed}
              total={bonusTotal}
              subtitle="Não expiram"
            />
          </div>

          {/* Action costs */}
          <div className="border-t border-border/50 pt-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Custo por ação
            </p>
            <div className="grid grid-cols-4 gap-2">
              {ACTION_COSTS.map((a) => (
                <div key={a.label} className="flex flex-col items-center gap-1 text-center">
                  <a.icon className={cn("h-3.5 w-3.5", a.color)} />
                  <span className="text-[10px] text-muted-foreground">{a.label}</span>
                  <span className="text-xs font-bold text-foreground">{a.cost}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Economy feedback */}
          {totalUsed > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-[11px] text-muted-foreground">
                💰 Você economizou ~<span className="text-foreground font-semibold">R$ {economyValue.toFixed(2).replace('.', ',')}</span> este mês
              </p>
            </div>
          )}

          {/* Upgrade CTA when exhausted */}
          {totalRemaining <= 0 && <UpgradeCTA />}
        </>
      )}
    </div>
  );
}

function UpgradeCTA() {
  const navigate = useNavigate();
  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <button
        onClick={() => navigate("/profile?tab=billing")}
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Crown className="h-3.5 w-3.5" /> Fazer upgrade
      </button>
    </div>
  );
}
