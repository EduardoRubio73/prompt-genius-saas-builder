import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Users,
  Sparkles,
  CreditCard,
  Settings,
  FileText,
  Flag,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

const navSections = [
  {
    label: "Visão Geral",
    items: [
      { to: "/admin", icon: LayoutGrid, label: "Overview", end: true },
    ],
  },
  {
    label: "Gestão",
    items: [
      { to: "/admin/users", icon: Users, label: "Usuários e Orgs" },
      { to: "/admin/prompts", icon: Sparkles, label: "Prompts e Specs" },
      { to: "/admin/billing", icon: CreditCard, label: "Planos e Billing" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { to: "/admin/ai-config", icon: Settings, label: "Config. de IA" },
      { to: "/admin/logs", icon: FileText, label: "Logs e Auditoria" },
      { to: "/admin/flags", icon: Flag, label: "Feature Flags" },
    ],
  },
];

function getBreadcrumb(pathname: string) {
  const segments = pathname.replace("/admin", "").split("/").filter(Boolean);
  return segments.length > 0 ? segments.join(" / ") : "overview";
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const breadcrumb = getBreadcrumb(location.pathname);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSearchNavigate = (path: string) => {
    navigate(path);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const searchResults = searchQuery.trim()
    ? navSections
        .flatMap((s) => s.items)
        .filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="flex min-h-screen bg-[#09090E] text-[#E8E6F0]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.06] bg-[#0F0F17] transition-[width] duration-200",
        collapsed ? "w-16" : "w-60"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-medium text-black"
            style={{
              background: "#F97316",
              fontFamily: "'IBM Plex Mono', monospace",
              boxShadow: "0 0 20px rgba(249,115,22,0.35)",
            }}
          >
            ⌘
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[13px] font-semibold leading-tight truncate">Admin Master</div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-orange-400 truncate">
                Prompt Genius
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navSections.map((section) => (
            <div key={section.label} className="px-3 py-3">
              {!collapsed && (
                <div className="mb-1 px-2 text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
                  {section.label}
                </div>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/admin"}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      "mb-0.5 flex items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-[13.5px] text-white/65 transition-all hover:bg-[#16161F] hover:text-[#E8E6F0]",
                      collapsed && "justify-center px-0",
                      isActive && "border-orange-500/20 bg-orange-500/10 text-orange-400"
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0 opacity-70" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Collapse button + Footer */}
        <div className="border-t border-white/[0.06] p-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center rounded-lg border border-white/[0.06] p-2 text-white/40 transition hover:bg-[#16161F] hover:text-white/70"
            title={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        <div className="border-t border-white/[0.06] p-3">
          <div className={cn(
            "flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/[0.08] px-2.5 py-2",
            collapsed && "justify-center px-1"
          )}>
            <div className="h-2 w-2 shrink-0 rounded-full bg-orange-500 shadow-[0_0_6px_#F97316]" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="truncate text-xs font-semibold">{profile?.full_name ?? "Admin"}</div>
                <div className="text-[10px] text-orange-400">superadmin</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className={cn("flex flex-1 flex-col transition-[margin-left] duration-200", collapsed ? "ml-16" : "ml-60")}>
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#0F0F17] px-7">
          <div
            className="text-[13px] text-white/40"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            admin / <span className="text-orange-400">{breadcrumb}</span>
          </div>

          {/* Global search */}
          <div className="relative">
            <button
              className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#16161F] px-3 py-1.5 text-[12px] text-white/40 hover:bg-[#1C1C28] transition-colors"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-3.5 w-3.5" />
              <span>Buscar...</span>
              <kbd className="ml-2 text-[10px] border border-white/10 rounded px-1 font-mono">⌘K</kbd>
            </button>

            {searchOpen && (
              <>
                <div className="fixed inset-0 z-50" onClick={() => setSearchOpen(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-lg border border-white/[0.06] bg-[#0F0F17] shadow-2xl">
                  <div className="p-2">
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar página..."
                      className="w-full rounded-md border border-white/10 bg-[#16161F] px-3 py-2 text-[13px] text-[#E8E6F0] placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                    />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="border-t border-white/[0.06] p-1">
                      {searchResults.map((item) => (
                        <button
                          key={item.to}
                          onClick={() => handleSearchNavigate(item.to)}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] text-white/65 hover:bg-[#16161F] hover:text-orange-400 transition"
                        >
                          <item.icon className="h-4 w-4 opacity-60" />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {searchQuery.trim() && searchResults.length === 0 && (
                    <div className="border-t border-white/[0.06] px-3 py-4 text-center text-[12px] text-white/30">
                      Nenhum resultado
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
