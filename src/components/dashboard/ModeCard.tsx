import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface ModeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  tags: readonly string[];
  href: string;
  accentClass: string;
  glowColor: string;
  disabled?: boolean;
}

export function ModeCard({ title, description, icon: Icon, tags, href, accentClass, glowColor, disabled }: ModeCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => !disabled && navigate(href)}
      disabled={disabled}
      className={cn(
        "glass-card group relative flex w-full flex-col items-start gap-4 p-6 text-left transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled
          ? "opacity-40 cursor-not-allowed grayscale"
          : "hover:scale-[1.02] hover:border-primary/30"
      )}
      style={{
        // @ts-ignore
        "--glow": glowColor,
      }}
    >
      {/* Glow effect */}
      {!disabled && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            boxShadow: `0 0 40px 4px ${glowColor}`,
          }}
        />
      )}

      <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-muted", disabled ? "text-muted-foreground" : accentClass)}>
        <Icon className="h-6 w-6" />
      </div>

      <div className="space-y-1">
        <h3 className="font-heading text-lg font-bold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>

      <span
        className={cn(
          "mt-auto inline-flex items-center gap-1.5 text-sm font-semibold transition-colors",
          disabled ? "text-muted-foreground" : accentClass
        )}
      >
        {disabled ? "Sem cotas disponíveis" : "Iniciar →"}
      </span>
    </button>
  );
}
