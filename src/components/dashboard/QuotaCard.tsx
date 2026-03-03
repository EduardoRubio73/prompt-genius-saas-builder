import { cn } from "@/lib/utils";
import { Zap, Sparkles, FileCode, Layers, Rocket, Crown } from "lucide-react";
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

export function QuotaCard({
  planUsed,
  planTotal,
  bonusUsed,
  bonusTotal,
  totalRemaining,
  loading = false,
}: QuotaCardProps) {
  const totalUsed = planUsed + bonusUsed;
  const totalTotal = planTotal + bonusTotal;
  const pct = totalTotal > 0 ? Math.min(100, Math.round((totalUsed / totalTotal) * 100)) : 0;
  const barColor =
    pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-warning" : "bg-primary";

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
              <p className="text-[11px] text-muted-foreground">{pct}% utilizado</p>
            )}
          </div>
        </div>
        {!loading && pct >= 80 && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-warning/10 text-warning border border-warning/20 uppercase tracking-wider">
            Atenção
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-5 w-40" />
        </div>
      ) : (
        <>
          {/* Bar */}
          <div className="h-2.5 w-full rounded-full bg-border overflow-hidden mb-3">
            <div
              className={cn("h-full rounded-full transition-all duration-700", barColor)}
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Numbers */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xl font-bold text-foreground tabular-nums">
                {totalUsed}
                <span className="text-sm font-normal text-muted-foreground ml-1">cotas usadas</span>
              </p>
            </div>
            <p className="text-sm text-muted-foreground tabular-nums">
              <span className="text-foreground font-semibold">{totalRemaining}</span> restantes
            </p>
          </div>

          {/* Breakdown: plan vs bonus */}
          <div className="flex gap-3 text-[11px] text-muted-foreground mb-4">
            <span>📋 Plano: {planUsed}/{planTotal}</span>
            {bonusTotal > 0 && <span>🎁 Bônus: {bonusUsed}/{bonusTotal}</span>}
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
          {totalRemaining <= 0 && (
            <UpgradeCTA />
          )}
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
