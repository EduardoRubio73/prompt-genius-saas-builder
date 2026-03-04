import { useState, useEffect } from "react";
import { Moon, Sun, LogOut, Settings, User, ChevronDown, CreditCard, Shield } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useNavigate, Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppShellProps {
  children: React.ReactNode;
  userName?: string | null;
  userEmail?: string | null;
  avatarUrl?: string | null;
  onSignOut?: () => void;
}

export function AppShell({
  children,
  userName,
  userEmail,
  avatarUrl,
  onSignOut,
}: AppShellProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("is_super_admin").then(({ data }) => setIsSuperAdmin(!!data));
  }, [user]);

  const displayName = userName || (userEmail ? userEmail.split("@")[0] : "Usuário");

  const initials = displayName
    .split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="noise-overlay relative min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 gap-4">

          {/* ── Left: Logo + App name ── */}
          <div className="flex items-center gap-3 shrink-0 min-w-0">
            <img
              src={logo}
              alt="Logo"
              className="h-7 w-auto object-contain shrink-0"
              style={{ maxWidth: 140 }}
            />
            <span className="hidden md:block text-xs font-semibold text-foreground/80 truncate leading-tight">
              Prompt Genius SaaS Builder Engineer - Assistant
            </span>
          </div>

          {/* ── Right: Theme toggle + User menu ── */}
          <div className="flex items-center gap-2">

            {/* Admin button (SuperAdmin only) */}
            {isSuperAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 h-8 text-xs">
                  <Shield className="h-3.5 w-3.5" />
                  Admin
                </Button>
              </Link>
            )}

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
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-xs font-medium text-foreground max-w-[120px] truncate">
                    {displayName.split(" ")[0]}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                {/* User info header */}
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
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
                <DropdownMenuItem onClick={() => navigate("/profile?tab=billing")} className="gap-2 text-sm cursor-pointer">
                  <CreditCard className="h-4 w-4" /> Plano & Cobrança
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
