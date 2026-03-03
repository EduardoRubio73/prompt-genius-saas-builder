import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid, Users, Sparkles, CreditCard, Settings,
  FileText, Flag, PanelLeftClose, PanelLeftOpen, Search, LogOut,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import "./admin.css";

const navSections = [
  {
    label: "Visão Geral",
    items: [{ to: "/admin", icon: LayoutGrid, label: "Overview", end: true }],
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
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const breadcrumb = getBreadcrumb(location.pathname);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const searchResults = searchQuery.trim()
    ? navSections.flatMap((s) => s.items).filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const initials = (profile?.full_name || "A").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="admin-root">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="logo-area">
          <div className="logo-icon">⌘</div>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Admin Master</div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--adm-accent)" }}>Prompt Genius</div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
          {navSections.map((section) => (
            <div key={section.label} className="nav-section">
              {!collapsed && <div className="nav-section-label">{section.label}</div>}
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/admin"}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? "active" : ""} ${collapsed ? "justify-center" : ""}`
                  }
                  style={collapsed ? { justifyContent: "center", padding: "9px 0" } : undefined}
                >
                  <item.icon size={16} style={{ opacity: .7, flexShrink: 0 }} />
                  {!collapsed && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ borderTop: `1px solid var(--adm-border)`, padding: 12 }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="adm-btn outline"
            style={{ width: "100%", justifyContent: "center" }}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>

          <button
            onClick={handleLogout}
            className="adm-btn outline"
            style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
            title="Sair"
          >
            <LogOut size={16} />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>

        <div style={{ borderTop: `1px solid var(--adm-border)`, padding: 12 }}>
          <div className="user-card" style={collapsed ? { justifyContent: "center", padding: "10px 4px" } : undefined}>
            <div className="user-avatar">{initials}</div>
            {!collapsed && (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {profile?.full_name ?? "Admin"}
                </div>
                <div style={{ fontSize: 10, color: "var(--adm-accent)" }}>superadmin</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", marginLeft: collapsed ? 64 : "var(--adm-sidebar-w)", transition: "margin-left .2s" }}>
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="breadcrumb">
            admin <span style={{ margin: "0 6px", opacity: .4 }}>/</span> <span className="bc-active">{breadcrumb}</span>
          </div>

          <div style={{ position: "relative" }}>
            <button className="search-pill" onClick={() => setSearchOpen(true)}>
              <Search size={14} />
              <span>Buscar...</span>
              <kbd>⌘K</kbd>
            </button>

            {searchOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 50 }} onClick={() => setSearchOpen(false)} />
                <div style={{
                  position: "absolute", right: 0, top: "100%", marginTop: 8, zIndex: 50,
                  width: 300, borderRadius: 12, border: `1px solid var(--adm-border)`,
                  background: "var(--adm-surface)", boxShadow: "0 20px 60px rgba(0,0,0,.5)",
                }}>
                  <div style={{ padding: 8 }}>
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar página..."
                      className="adm-input"
                    />
                  </div>
                  {searchResults.length > 0 && (
                    <div style={{ borderTop: `1px solid var(--adm-border)`, padding: 4 }}>
                      {searchResults.map((item) => (
                        <button
                          key={item.to}
                          onClick={() => handleSearchNavigate(item.to)}
                          className="nav-item"
                          style={{ width: "100%" }}
                        >
                          <item.icon size={14} style={{ opacity: .6 }} />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {searchQuery.trim() && searchResults.length === 0 && (
                    <div style={{ borderTop: `1px solid var(--adm-border)`, padding: "16px", textAlign: "center", fontSize: 12, color: "var(--adm-text-soft)" }}>
                      Nenhum resultado
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
