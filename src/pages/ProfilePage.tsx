import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { User, Lock, Bell, CreditCard, Upload, Save, Check, LayoutDashboard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useQuotaBalance } from "@/hooks/useQuotaBalance";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label htmlFor="fullName">Nome completo</Label>
          <InfoTooltip content="Como será exibido no app e para outros membros da organização. Ex: João Silva" />
        </div>
        <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>

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
    { key: "usageAlerts" as const, label: "Alertas de consumo (80%)", desc: "Aviso quando atingir 80% do limite de cotas", tip: "Notificação por e-mail quando seu consumo de cotas atingir 80% do limite." },
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
interface BillingProduct {
  id: string;
  name: string;
  display_name: string | null;
  plan_tier: string;
  is_featured: boolean;
  total_quotas_label: string | null;
  prompts_label: string | null;
  prompts_detail: string | null;
  saas_specs_label: string | null;
  saas_specs_detail: string | null;
  misto_label: string | null;
  misto_detail: string | null;
  build_label: string | null;
  build_detail: string | null;
  members_label: string | null;
  trial_label: string | null;
  period_label: string | null;
  cta_label: string | null;
  billing_price_id: string | null;
  stripe_price_id: string | null;
  recurring_interval: string | null;
  sort_order: number;
  unit_amount: number | null;
}

function useBillingProducts() {
  return useQuery({
    queryKey: ["billing-products-profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_active_stripe_plans")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        id: p.product_id,
        name: p.name,
        display_name: p.display_name,
        plan_tier: p.plan_tier,
        is_featured: p.is_featured ?? false,
        sort_order: p.sort_order || 0,
        total_quotas_label: p.total_quotas_label ?? null,
        prompts_label: p.prompts_label ?? null,
        prompts_detail: p.prompts_detail ?? null,
        saas_specs_label: p.saas_specs_label ?? null,
        saas_specs_detail: p.saas_specs_detail ?? null,
        misto_label: p.misto_label ?? null,
        misto_detail: p.misto_detail ?? null,
        build_label: p.build_label ?? null,
        build_detail: p.build_detail ?? null,
        members_label: p.members_label ?? null,
        trial_label: p.trial_label ?? null,
        period_label: p.period_label ?? p.recurring_interval,
        cta_label: p.cta_label ?? "Assinar",
        billing_price_id: p.price_id,
        stripe_price_id: p.stripe_price_id,
        recurring_interval: p.recurring_interval,
        unit_amount: p.unit_amount,
      })) as BillingProduct[];
    },
  });
}

function BillingTab({ orgId }: { orgId: string | undefined }) {
  const { data: quota, isLoading: quotaLoading } = useQuotaBalance(orgId);
  const { data: products, isLoading: productsLoading } = useBillingProducts();

  const subscribe = async (priceId: string) => {
    const { data, error } = await supabase.functions.invoke("create-checkout-session", {
      body: { price_id: priceId },
    });

    if (error) {
      toast.error("Não foi possível iniciar a assinatura.");
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
      return;
    }

    toast.error("Não foi possível redirecionar para o checkout.");
  };

  // Get org plan_tier
  const { data: org } = useQuery({
    queryKey: ["org-plan-tier", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("plan_tier")
        .eq("id", orgId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const currentTier = org?.plan_tier ?? "free";

  // Quota bars
  const planUsed = quota?.plan_used ?? 0;
  const planTotal = quota?.plan_total ?? 0;
  const planPct = planTotal > 0 ? Math.min(100, Math.round((planUsed / planTotal) * 100)) : 0;

  const bonusUsed = quota?.bonus_used ?? 0;
  const bonusTotal = quota?.bonus_total ?? 0;
  const bonusPct = bonusTotal > 0 ? Math.min(100, Math.round((bonusUsed / bonusTotal) * 100)) : 0;

  const barColor = (pct: number) =>
    pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-yellow-500" : "bg-primary";

  const featureRow = (label: string | null, detail: string | null) => {
    if (!label) return null;
    return (
      <div className="flex items-start gap-2 text-sm">
        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="text-foreground font-medium">{label}</span>
          {detail && <span className="text-muted-foreground ml-1">— {detail}</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Quota bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <div className="rounded-xl border border-border/60 p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Cotas do Plano
          </p>
          {quotaLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <div className="h-3 w-full rounded-full bg-border overflow-hidden mb-2">
                <div className={cn("h-full rounded-full transition-all", barColor(planPct))} style={{ width: `${planPct}%` }} />
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-semibold">{planUsed}</span> / {planTotal} cotas usadas ({planPct}%)
              </p>
              {quota?.reset_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Renova em {new Date(quota.reset_at).toLocaleDateString("pt-BR")}
                </p>
              )}
            </>
          )}
        </div>

        <div className="rounded-xl border border-border/60 p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Cotas Bônus
          </p>
          {quotaLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <div className="h-3 w-full rounded-full bg-border overflow-hidden mb-2">
                <div className={cn("h-full rounded-full transition-all", bonusTotal > 0 ? barColor(bonusPct) : "bg-muted")} style={{ width: `${bonusPct}%` }} />
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-semibold">{bonusUsed}</span> / {bonusTotal} bônus usadas ({bonusPct}%)
              </p>
              <p className="text-xs text-muted-foreground mt-1">Cotas bônus não expiram</p>
            </>
          )}
        </div>
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Planos disponíveis</h2>
        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-72 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl">
            {(products ?? []).map((plan) => {
              const isCurrent = plan.plan_tier === currentTier;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "rounded-xl border p-5 transition-colors flex flex-col",
                    isCurrent ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border/60 bg-card/50",
                    plan.is_featured && !isCurrent && "border-primary/40 ring-1 ring-primary/20"
                  )}
                >
                  {/* Featured badge */}
                  {plan.is_featured && (
                    <div className="flex justify-center -mt-8 mb-2">
                      <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-primary-foreground uppercase tracking-wider">
                        ⭐ Mais popular
                      </span>
                    </div>
                  )}

                  {/* Plan name */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-primary">
                      {plan.display_name ?? plan.name ?? plan.id}
                    </h3>
                    {isCurrent && (
                      <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground uppercase">
                        Atual
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-1">
                    <span className="text-sm text-muted-foreground align-top">R$</span>
                    <span className="text-4xl font-extrabold text-foreground ml-1 tracking-tight">
                      {plan.unit_amount != null ? (plan.unit_amount / 100).toFixed(0) : "0"}
                    </span>
                  </div>
                  {plan.period_label && (
                    <p className="text-xs text-muted-foreground mb-1">{plan.period_label}</p>
                  )}
                  {plan.trial_label && (
                    <p className="text-xs text-primary font-medium mb-4 mt-1 inline-flex items-center gap-1">
                      <Check className="h-3 w-3" /> {plan.trial_label}
                    </p>
                  )}

                  {plan.total_quotas_label && (
                    <p className="text-sm font-semibold text-foreground mb-3 mt-2">
                      {plan.total_quotas_label}
                    </p>
                  )}

                  <div className="space-y-2 flex-1 mb-4">
                    {featureRow(plan.prompts_label, plan.prompts_detail)}
                    {featureRow(plan.saas_specs_label, plan.saas_specs_detail)}
                    {featureRow(plan.misto_label, plan.misto_detail)}
                    {featureRow(plan.build_label, plan.build_detail)}
                    {featureRow(plan.members_label, null)}
                  </div>

                  {isCurrent ? (
                    <div className="w-full rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-center text-xs font-medium text-primary">
                      Plano atual
                    </div>
                  ) : (
                    <Button
                      onClick={() => subscribe(plan.stripe_price_id ?? "")}
                      disabled={!plan.stripe_price_id}
                      className="w-full"
                    >
                      Assinar
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ──
export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { data: profile, refetch } = useProfile(user?.id);
  const orgId = profile?.personal_org_id ?? undefined;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab = (searchParams.get("tab") as TabKey) || "profile";
  const setTab = (tab: TabKey) => setSearchParams({ tab });

  return (
    <AppShell
      userName={profile?.full_name}
      userEmail={profile?.email}
      avatarUrl={profile?.avatar_url}
      onSignOut={signOut}
    >
      <section className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Minha conta</h1>
      </section>

      <div className="flex flex-col gap-6 sm:flex-row">
        <nav className="flex sm:flex-col gap-1 sm:w-48 shrink-0">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </button>
          <div className="border-b sm:border-b sm:my-1" />
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

        <div className="flex-1 min-w-0">
          {activeTab === "profile" && user && (
            <ProfileTab userId={user.id} profile={profile} onRefresh={() => refetch()} />
          )}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "billing" && <BillingTab orgId={orgId} />}
        </div>
      </div>
    </AppShell>
  );
}
