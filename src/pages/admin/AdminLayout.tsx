import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Users,
  Sparkles,
  CreditCard,
  Settings,
  FileText,
  Flag,
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
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const breadcrumb = getBreadcrumb(location.pathname);

  return (
    <div className="flex min-h-screen bg-[#09090E] text-[#E8E6F0]" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-white/[0.06] bg-[#0F0F17]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-5 py-5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium text-black"
            style={{
              background: "#F97316",
              fontFamily: "'IBM Plex Mono', monospace",
              boxShadow: "0 0 20px rgba(249,115,22,0.35)",
            }}
          >
            ⌘
          </div>
          <div>
            <div className="text-[13px] font-semibold leading-tight">Admin Master</div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-orange-400">
              Prompt Genius SaaS Builder
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navSections.map((section) => (
            <div key={section.label} className="px-3 py-3">
              <div className="mb-1 px-2 text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
                {section.label}
              </div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/admin"}
                  className={({ isActive }) =>
                    cn(
                      "mb-0.5 flex items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-[13.5px] text-white/65 transition-all hover:bg-[#16161F] hover:text-[#E8E6F0]",
                      isActive &&
                        "border-orange-500/20 bg-orange-500/10 text-orange-400"
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0 opacity-70" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/[0.06] p-4">
          <div className="flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/[0.08] px-2.5 py-2">
            <div className="h-2 w-2 shrink-0 rounded-full bg-orange-500 shadow-[0_0_6px_#F97316]" />
            <div className="flex-1 min-w-0">
              <div className="truncate text-xs font-semibold">{profile?.full_name ?? "Admin"}</div>
              <div className="text-[10px] text-orange-400">superadmin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="ml-60 flex flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#0F0F17] px-7">
          <div
            className="text-[13px] text-white/40"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            admin / <span className="text-orange-400">{breadcrumb}</span>
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
