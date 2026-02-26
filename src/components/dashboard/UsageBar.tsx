import { cn } from "@/lib/utils";

interface UsageBarProps {
  consumed: number;
  total: number;
  className?: string;
}

export function UsageBar({ consumed, total, className }: UsageBarProps) {
  const pct = total > 0 ? Math.min((consumed / total) * 100, 100) : 0;
  const isHigh = pct > 80;

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <div className="relative h-2 w-24 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            isHigh
              ? "bg-destructive"
              : "bg-gradient-to-r from-primary to-secondary"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="tabular-nums font-medium">
        {consumed.toLocaleString("pt-BR")}/{total.toLocaleString("pt-BR")}
      </span>
    </div>
  );
}
