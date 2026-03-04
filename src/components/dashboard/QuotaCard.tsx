import { cn } from "@/lib/utils";
import { Zap, Sparkles, FileCode, Layers, Rocket, Crown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useNavigate } from "react-router-dom";

interface QuotaCardProps {
  creditsUsed: number;
  creditsLimit: number;
  creditsRemaining: number;
  percentUsed: number;
  extraCredits?: number;
  loading?: boolean;
}

const ACTION_COSTS = [
  { label: "Prompt", icon: Sparkles, cost: 1, color: "text-primary" },
  { label: "SaaS Spec", icon: FileCode, cost: 2, color: "text-accent" },
  { label: "Misto", icon: Layers, cost: 3, color: "text-secondary" },
  { label: "BUILD", icon: Rocket, cost: 5, color: "text-primary" },
];

export function QuotaCard({
  creditsUsed,
  creditsLimit,
  creditsRemaining,
  percentUsed,
  extraCredits = 0,
  loading = false,
}: QuotaCardProps) {
  const totalRemaining = creditsRemaining + extraCredits;
  const barColor =
    percentUsed >= 100 ? "bg-destructive" : percentUsed >= 80 ? "bg-yellow-500" : "bg-primary";

  return (
    <div className="glass-card p-5 col-span-full sm:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Zap className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Cotas do período
            </p>
            <InfoTooltip content="Todas as ações utilizam a mesma bolsa de cotas. Você pode combinar diferentes ações até consumir seu limite mensal." />
          </div>
        </div>
        {!loading && creditsRemaining <= 0 && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 uppercase tracking-wider">
            Esgotado
          </span>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <>
          <div className="h-2 w-full rounded-full bg-border overflow-hidden mb-2">
            <div
              className={cn("h-full rounded-full transition-all duration-700", barColor)}
              style={{ width: `${Math.min(100, Math.max(0, percentUsed))}%` }}
            />
          </div>

          <div className="space-y-1 mb-4">
            <p className="text-sm text-muted-foreground tabular-nums">
              <span className="text-foreground font-semibold">{creditsUsed}</span> / {creditsLimit} usadas
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              <span className="text-foreground font-semibold">{creditsRemaining}</span> restantes
            </p>
            {extraCredits > 0 && (
              <p className="text-xs text-accent tabular-nums">
                + <span className="font-semibold">{extraCredits}</span> créditos extras
              </p>
            )}
          </div>

          <div className="border-t border-border/50 pt-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Custo por ação
            </p>
            <div className="grid grid-cols-4 gap-2">
              {ACTION_COSTS.map((a) => {
                const maxActions = Math.floor(creditsRemaining / a.cost);
                return (
                  <div key={a.label} className="flex flex-col items-center gap-1 text-center">
                    <div className="flex items-center gap-0.5">
                      <a.icon className={cn("h-3.5 w-3.5", a.color)} />
                      <InfoTooltip
                        content={`Com seu saldo atual você pode gerar até ${maxActions} ${a.label}${maxActions !== 1 ? "s" : ""}.`}
                        side="top"
                        className="ml-0"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{a.label}</span>
                    <span className="text-xs font-bold text-foreground">{a.cost}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {creditsRemaining <= 0 && <UpgradeCTA />}
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
