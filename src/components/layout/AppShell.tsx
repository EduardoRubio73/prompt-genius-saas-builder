import { Moon, Sun, LogOut, Settings, User, ChevronDown, Zap } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  userName?: string | null;
  userEmail?: string | null;
  avatarUrl?: string | null;
  tokenConsumed?: number;
  tokenTotal?: number;
  onSignOut?: () => void;
}

export function AppShell({
  children,
  userName,
  userEmail,
  avatarUrl,
  tokenConsumed = 0,
  tokenTotal = 10000,
  onSignOut,
}: AppShellProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const usagePct = Math.min(100, Math.round((tokenConsumed / tokenTotal) * 100));
  const usageColor =
    usagePct >= 90 ? "bg-destructive" : usagePct >= 70 ? "bg-warning" : "bg-primary";

  return (
    <div className="noise-overlay relative min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 gap-4">

          {/* ── Left: Logo only ── */}
          <div className="flex items-center shrink-0">
            <img
              src={logo}
              alt="Logo"
              className="h-7 w-auto object-contain"
              style={{ maxWidth: 140 }}
            />
          </div>

          {/* ── Right: Credits pill + Theme toggle + User menu ── */}
          <div className="flex items-center gap-2">

            {/* Credits / usage compact pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-muted/50 text-xs font-medium text-muted-foreground">
              <Zap className="w-3 h-3 text-primary" />
              <span className="tabular-nums">
                <span className="text-foreground font-semibold">{tokenConsumed.toLocaleString("pt-BR")}</span>
                {" / "}
                {tokenTotal.toLocaleString("pt-BR")}
              </span>
              {/* Mini progress bar */}
              <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", usageColor)}
                  style={{ width: `${usagePct}%` }}
                />
              </div>
              <span className="text-[10px] opacity-60">{usagePct}%</span>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Alternar tema"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* User avatar dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 border border-border/60 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-6 w-6 border border-border">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={userName ?? ""} />}
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {userName && (
                    <span className="hidden sm:block text-xs font-medium text-foreground max-w-[120px] truncate">
                      {userName.split(" ")[0]}
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                {/* User info header */}
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-sm font-semibold text-foreground truncate">{userName ?? "Usuário"}</p>
                  {userEmail && (
                    <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                  )}
                </div>

                <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2 text-sm cursor-pointer">
                  <User className="h-4 w-4" /> Meu perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile?tab=notifications")} className="gap-2 text-sm cursor-pointer">
                  <Settings className="h-4 w-4" /> Configurações
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={onSignOut}
                  className="gap-2 text-sm text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
