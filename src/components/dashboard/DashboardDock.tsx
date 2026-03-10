import { useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, FileCode, Layers, Rocket, Brain, Clock, Gift, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface DockEntry {
  icon: React.ElementType;
  label: string;
  href: string;
  color: string;
  badge?: number;
}

const MODE_ITEMS: DockEntry[] = [
  { icon: Sparkles, label: "Prompt", href: "/prompt", color: "dock-purple" },
  { icon: FileCode, label: "SaaS Spec", href: "/saas-spec", color: "dock-blue" },
  { icon: Layers, label: "Modo Misto", href: "/mixed", color: "dock-green" },
  { icon: Rocket, label: "BUILD Engine", href: "/build", color: "dock-amber" },
];

const NAV_ITEMS: DockEntry[] = [
  { icon: Brain, label: "Minha Memória", href: "/memory", color: "dock-slate" },
  { icon: Clock, label: "Histórico", href: "/history", color: "dock-slate" },
];

const ACCOUNT_ITEMS: DockEntry[] = [
  { icon: Gift, label: "Indicações (+5)", href: "/indicacoes", color: "dock-rose" },
  { icon: CreditCard, label: "Comprar Créditos", href: "/profile?tab=billing", color: "dock-purple" },
];

export function DashboardDock({ sessionCount }: { sessionCount?: number }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dockRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback((idx: number) => {
    if (!dockRef.current) return;
    const items = dockRef.current.querySelectorAll<HTMLElement>("[data-dock-item]");
    items.forEach((el, j) => {
      const dist = Math.abs(idx - j);
      const scale = dist === 0 ? 1.12 : dist === 1 ? 1.05 : 1;
      const ty = dist === 0 ? 8 : dist === 1 ? 4 : 0;
      el.style.transform = `translateY(-${ty}px) scale(${scale})`;
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!dockRef.current) return;
    const items = dockRef.current.querySelectorAll<HTMLElement>("[data-dock-item]");
    items.forEach((el) => { el.style.transform = ""; });
  }, []);

  const allItems = [
    ...MODE_ITEMS,
    "divider" as const,
    ...NAV_ITEMS.map((item) =>
      item.href === "/history" && sessionCount ? { ...item, badge: sessionCount } : item
    ),
    "divider" as const,
    ...ACCOUNT_ITEMS,
  ];

  let itemIdx = 0;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200]">
      <div
        ref={dockRef}
        className="flex items-end gap-2 rounded-[28px] border border-border/80 bg-card/88 px-4 py-2.5 shadow-[0_8px_40px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl dark:bg-card/60 dark:border-border/40"
        onMouseLeave={handleMouseLeave}
      >
        {allItems.map((entry, i) => {
          if (entry === "divider") {
            return <div key={`div-${i}`} className="mx-1 h-9 w-px self-center bg-border" />;
          }

          const currentIdx = itemIdx++;
          const isActive = location.pathname === entry.href;
          const Icon = entry.icon;

          return (
            <button
              key={entry.href}
              data-dock-item
              onClick={() => navigate(entry.href)}
              onMouseEnter={() => handleMouseEnter(currentIdx)}
              className={cn(
                "group relative flex flex-col items-center gap-1 cursor-pointer transition-transform duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
              )}
              style={{ transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)" }}
            >
              {/* Floating label */}
              <span className="pointer-events-none absolute bottom-[calc(100%+10px)] whitespace-nowrap rounded-lg bg-foreground/85 px-2 py-1 text-[10px] font-semibold text-background opacity-0 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-foreground/85">
                {entry.label}
              </span>

              {/* Icon */}
              <div className={cn("relative flex h-[52px] w-[52px] items-center justify-center rounded-2xl border border-border/30 transition-shadow group-hover:shadow-lg", entry.color)}>
                <Icon className="h-6 w-6" />
                {entry.badge && entry.badge > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground border-2 border-background">
                    {entry.badge}
                  </span>
                )}
              </div>

              {/* Active dot */}
              <span className={cn(
                "absolute -bottom-2 h-[5px] w-[5px] rounded-full transition-opacity",
                isActive ? "opacity-100 bg-primary" : "opacity-0 bg-muted-foreground"
              )} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
