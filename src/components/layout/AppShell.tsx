import { Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import logo from "@/assets/logo.png";
import { UsageBar } from "@/components/dashboard/UsageBar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppShellProps {
  children: React.ReactNode;
  userName?: string | null;
  orgName?: string | null;
  tokenConsumed?: number;
  tokenTotal?: number;
  onSignOut?: () => void;
}

export function AppShell({
  children,
  userName,
  orgName,
  tokenConsumed = 0,
  tokenTotal = 10000,
  onSignOut,
}: AppShellProps) {
  const { theme, toggleTheme } = useTheme();

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "PG";

  return (
    <div className="noise-overlay relative min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          {/* Left: Logo + org */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="Prompt Genius SaaS Builder" className="h-8 w-auto" />
            {orgName && (
              <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
                {orgName}
              </span>
            )}
          </div>

          {/* Right: Usage + Theme + Avatar */}
          <div className="flex items-center gap-3">
            <UsageBar consumed={tokenConsumed} total={tokenTotal} className="hidden sm:flex" />

            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Alternar tema"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarFallback className="bg-muted text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {userName && (
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                    {userName}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
