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
  display_name: string | null;
  price_brl: number;
  credits_limit: number;
  prompts_limit: number;
  saas_specs_limit: number;
  modo_misto_limit: number;
  build_engine_limit: number;
  members_label: string | null;
  is_featured: boolean;
  sort_order: number;
  stripe_price_id: string | null;
}

function useBillingProducts() {
  return useQuery({
    queryKey: ["billing-products-profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_active_stripe_plans")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        display_name: p.display_name ?? null,
        price_brl: Number(p.price_brl ?? 0),
        credits_limit: Number(p.credits_limit ?? 0),
        prompts_limit: Number(p.prompts_limit ?? 0),
        saas_specs_limit: Number(p.saas_specs_limit ?? 0),
        modo_misto_limit: Number(p.modo_misto_limit ?? 0),
        build_engine_limit: Number(p.build_engine_limit ?? 0),
        members_label: p.members_label ?? null,
        is_featured: Boolean(p.is_featured),
        sort_order: Number(p.sort_order ?? 0),
        stripe_price_id: p.stripe_price_id ?? null,
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

  // Quota bars
  const planPct = Number(quota?.percent_used ?? 0);

  const barColor = (pct: number) =>
    pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-yellow-500" : "bg-primary";

  const featureRow = (label: string, value: string) => {
    return (
      <div className="flex items-start gap-2 text-sm">
        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="text-foreground font-medium">{label}</span>
          <span className="text-muted-foreground ml-1">— {value}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Quota bar */}
      <div className="max-w-2xl">
        <div className="rounded-xl border border-border/60 p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Cotas do Plano
          </p>
          {quotaLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <div className="h-3 w-full rounded-full bg-border overflow-hidden mb-2">
                <div className={cn("h-full rounded-full transition-all", barColor(planPct))} style={{ width: `${Math.min(100, Math.max(0, planPct))}%` }} />
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-semibold">{quota?.credits_used ?? 0}</span> / {quota?.credits_limit ?? 0} usadas
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-foreground font-semibold">{quota?.credits_remaining ?? 0}</span> restantes
              </p>
              {quota?.current_period_end && (
                <p className="text-xs text-muted-foreground mt-1">
                  Renova em {new Date(quota.current_period_end).toLocaleDateString("pt-BR")}
                </p>
              )}
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
              const isCurrent = (plan.display_name ?? "").toLowerCase() === (quota?.plan_name ?? "").toLowerCase();
              return (
                <div
                  key={`${plan.display_name}-${plan.sort_order}`}
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
                      {plan.display_name ?? "Plano"}
                    </h3>
                    {isCurrent && (
                      <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground uppercase">
                        Atual
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-1">
                    <span className="text-4xl font-extrabold text-foreground tracking-tight">
                      {(() => {
                        const price = Number(plan.price_brl);
                        return price === 0 ? "R$ 0" : `R$ ${price}`;
                      })()}
                    </span>
                  </div>
                  {(() => {
                    const interval = "mês";
                    const fmtVal = (val: number) => `${val} / ${interval}`;
                    return (
                      <>
                        <p className="text-xs text-muted-foreground mb-1">por {interval}</p>

                        <p className="text-sm font-semibold text-foreground mb-3 mt-2">
                          {`${plan.credits_limit} cotas / ${interval}`}
                        </p>

                        <div className="space-y-2 flex-1 mb-4">
                          {featureRow("✨ Prompts (1 cota)", fmtVal(plan.prompts_limit))}
                          {featureRow("🏗️ SaaS Specs (2 cotas)", fmtVal(plan.saas_specs_limit))}
                          {featureRow("⚡ Modo Misto (2 cotas)", fmtVal(plan.modo_misto_limit))}
                          {featureRow("⚙️ BUILD Engine (5 cotas)", fmtVal(plan.build_engine_limit))}
                          {featureRow("👥 Membros", plan.members_label ?? "1")}
                        </div>
                      </>
                    );
                  })()}

                  {isCurrent ? (
                    <div className="w-full rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-center text-xs font-medium text-primary">
                      Plano atual
                    </div>
                  ) : Number(plan.price_brl) === 0 ? (
                    <div className="w-full rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-center text-xs font-medium text-muted-foreground">
                      Plano gratuito
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
