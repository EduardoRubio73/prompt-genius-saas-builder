import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { User, Lock, Bell, CreditCard, Upload, Save, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTokenBudget } from "@/hooks/useOrgStats";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TABS = [
  { key: "profile", label: "Perfil", icon: User },
  { key: "security", label: "Segurança", icon: Lock },
  { key: "notifications", label: "Notificações", icon: Bell },
  { key: "billing", label: "Plano & Cobrança", icon: CreditCard },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ── Profile Tab ──
function ProfileTab({ userId, profile, onRefresh }: { userId: string; profile: any; onRefresh: () => void }) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setAvatarUrl(profile?.avatar_url ?? "");
  }, [profile]);

  const initials = fullName
    ? fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro no upload: " + error.message); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(publicUrl);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
    toast.success("Avatar atualizado!");
    onRefresh();
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", userId);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Perfil atualizado!");
    onRefresh();
  };

  return (
    <div className="space-y-6 max-w-lg">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <button onClick={() => fileRef.current?.click()} className="relative group">
          <Avatar className="h-20 w-20 border-2 border-border">
            {avatarUrl && <AvatarImage src={avatarUrl} />}
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <Upload className="h-5 w-5 text-white" />
          </div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        <div>
          <p className="text-sm font-semibold text-foreground">{fullName || "Seu nome"}</p>
          <p className="text-xs text-muted-foreground">{profile?.email}</p>
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label htmlFor="fullName">Nome completo</Label>
          <InfoTooltip content="Como será exibido no app e para outros membros da organização. Ex: João Silva" />
        </div>
        <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>

      {/* Email readonly */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label>E-mail</Label>
          <InfoTooltip content="Não editável. Vinculado à autenticação da conta. Para alterar, entre em contato com o suporte." />
        </div>
        <Input value={profile?.email ?? ""} disabled className="opacity-60" />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar alterações"}
      </button>
    </div>
  );
}

// ── Security Tab ──
function SecurityTab() {
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (newPw.length < 8) { toast.error("Senha deve ter pelo menos 8 caracteres"); return; }
    if (newPw !== confirmPw) { toast.error("Senhas não coincidem"); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Senha atualizada!");
    setNewPw(""); setConfirmPw("");
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label htmlFor="newPw">Nova senha</Label>
          <InfoTooltip content="Mínimo 8 caracteres. Use letras maiúsculas, minúsculas, números e símbolos para mais segurança." />
        </div>
        <Input id="newPw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Mínimo 8 caracteres" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label htmlFor="confirmPw">Confirmar senha</Label>
          <InfoTooltip content="Repita a mesma senha digitada acima para confirmar." />
        </div>
        <Input id="confirmPw" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
      </div>
      <button
        onClick={handleChangePassword}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        <Lock className="h-4 w-4" /> {saving ? "Atualizando..." : "Alterar senha"}
      </button>
    </div>
  );
}

// ── Notifications Tab ──
function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    weeklyDigest: true,
    usageAlerts: true,
    productNews: false,
    sessionComplete: true,
  });

  const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const items = [
    { key: "weeklyDigest" as const, label: "Resumo semanal por e-mail", desc: "Receba um resumo das suas atividades toda semana", tip: "Enviado toda segunda-feira com métricas de uso, prompts e specs da semana." },
    { key: "usageAlerts" as const, label: "Alertas de consumo (80%)", desc: "Aviso quando atingir 80% do limite de tokens", tip: "Notificação por e-mail quando seu consumo de tokens atingir 80% do limite." },
    { key: "productNews" as const, label: "Novidades do produto", desc: "Receba atualizações sobre novas funcionalidades", tip: "Newsletter mensal com novas features, dicas e melhorias da plataforma." },
    { key: "sessionComplete" as const, label: "Sessão longa concluída", desc: "Notificação ao concluir sessões demoradas", tip: "Alerta quando uma sessão de geração que demorou mais de 30s for finalizada." },
  ];

  return (
    <div className="space-y-4 max-w-lg">
      {items.map((item) => (
        <div key={item.key} className="flex items-center justify-between rounded-xl border border-border/60 p-4">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <InfoTooltip content={item.tip} />
            </div>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
          <Switch checked={prefs[item.key]} onCheckedChange={() => toggle(item.key)} />
        </div>
      ))}
      <button
        onClick={() => toast.success("Preferências salvas!")}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Save className="h-4 w-4" /> Salvar preferências
      </button>
    </div>
  );
}

// ── Billing Tab ──
function BillingTab({ budget }: { budget: { consumed: number; limit_total: number } | null }) {
  const consumed = budget?.consumed ?? 0;
  const total = budget?.limit_total ?? 10000;
  const pct = total > 0 ? Math.min(100, Math.round((consumed / total) * 100)) : 0;
  const barColor = pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-warning" : "bg-primary";

  const plans = [
    { name: "Free", price: "R$ 0", credits: "5 cotas/mês", current: true },
    { name: "Pro", price: "R$ 49/mês", credits: "120 cotas/mês", current: false },
    { name: "Enterprise", price: "Sob consulta", credits: "Ilimitado", current: false },
  ];

  return (
    <div className="space-y-6">
      {/* Usage bar */}
      <div className="rounded-xl border border-border/60 p-5 max-w-lg">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Consumo atual</p>
        <div className="h-3 w-full rounded-full bg-border overflow-hidden mb-2">
          <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-semibold">{consumed.toLocaleString("pt-BR")}</span> / {total.toLocaleString("pt-BR")} tokens ({pct}%)
        </p>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-3xl">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "rounded-xl border p-5 transition-colors",
              plan.current ? "border-primary bg-primary/5" : "border-border/60 bg-card/50"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
              {plan.current && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground uppercase">Atual</span>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">{plan.price}</p>
            <p className="text-xs text-muted-foreground mb-4">{plan.credits}</p>
            {!plan.current && (
              <button className="w-full rounded-lg border border-primary bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
                Upgrade
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ──
export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile, refetch } = useProfile(user?.id);
  const orgId = profile?.personal_org_id ?? undefined;
  const { data: budget } = useTokenBudget(orgId);
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = (searchParams.get("tab") as TabKey) || "profile";
  const setTab = (tab: TabKey) => setSearchParams({ tab });

  return (
    <AppShell
      userName={profile?.full_name}
      userEmail={profile?.email}
      avatarUrl={profile?.avatar_url}
      onSignOut={signOut}
    >
      <section className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/dashboard")} className="rounded-lg p-2 hover:bg-muted transition-colors" aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Minha conta</h1>
      </section>

      <div className="flex flex-col gap-6 sm:flex-row">
        {/* Sidebar tabs */}
        <nav className="flex sm:flex-col gap-1 sm:w-48 shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left",
                  activeTab === tab.key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && user && (
            <ProfileTab userId={user.id} profile={profile} onRefresh={() => refetch()} />
          )}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "billing" && <BillingTab budget={budget ?? null} />}
        </div>
      </div>
    </AppShell>
  );
}
