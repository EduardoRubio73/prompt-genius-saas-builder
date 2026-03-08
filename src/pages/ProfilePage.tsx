import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Upload, Save, Check, Coins, Loader2, ShieldAlert, Lock, CreditCard, ShieldCheck } from "lucide-react";
import { AccountSidebar, type AccountTabKey } from "@/components/layout/AccountSidebar";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useQuotaBalance } from "@/hooks/useQuotaBalance";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction } from "@/lib/edgeFunctions";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TabKey = AccountTabKey;

// ── Profile Tab ──
function ProfileTab({ userId, profile, onRefresh }: { userId: string; profile: any; onRefresh: () => void }) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [celular, setCelular] = useState(profile?.celular?.toString() ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setAvatarUrl(profile?.avatar_url ?? "");
    setCelular(profile?.celular?.toString() ?? "");
  }, [profile]);

  const isActive = profile?.ativo !== false;

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
    const { error } = await supabase.from("profiles").update({
      full_name: fullName,
      celular: celular ? Number(celular) : null,
    }).eq("id", userId);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Perfil atualizado!");
    onRefresh();
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    const { error } = await supabase.from("profiles").update({ ativo: false }).eq("id", userId);
    setDeactivating(false);
    if (error) { toast.error("Erro ao desativar conta"); return; }
    toast.success("Conta desativada.");
    await signOut();
    navigate("/");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6 max-w-lg">
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
            <Badge variant={isActive ? "default" : "destructive"} className="mt-1">
              {isActive ? "✅ Ativo" : "❌ Inativo"}
            </Badge>
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

        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="celular">📱 Celular</Label>
            <InfoTooltip content="Número verificado via WhatsApp. Se alterar o número, será necessário verificar novamente no próximo login." />
            {celular && <PhoneVerifiedBadge userId={userId} currentPhone={celular} />}
          </div>
          <Input
            id="celular"
            value={celular}
            onChange={(e) => setCelular(e.target.value.replace(/\D/g, ""))}
            placeholder="11999999999"
            inputMode="numeric"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>

      {/* Deactivate Account */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 shadow-sm max-w-lg">
        <h3 className="text-sm font-bold text-destructive mb-2 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" /> Zona de perigo
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Ao desativar sua conta, você perderá acesso a todas as funcionalidades. Para reativar, será necessário contatar o suporte.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              Desativar Conta
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2 text-left">
                <p>Desativar sua conta impedirá:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Acesso a todas as funcionalidades</li>
                  <li>Execução de qualquer ação</li>
                  <li>Recuperação automática</li>
                </ul>
                <p className="mt-2">
                  Para reativar, envie email para <strong>zragencyia@gmail.com</strong>.
                </p>
                <p className="font-semibold mt-3">Tem certeza que deseja continuar?</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeactivate}
                disabled={deactivating}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deactivating ? "Desativando..." : "Desativar Definitivamente"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
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
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6 max-w-lg">
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
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4 max-w-lg">
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
    </div>
  );
}

// ── Billing Tab ──
interface BillingProduct {
  display_name: string | null;
  name: string | null;
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
  plan_tier: string | null;
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
        name: p.name ?? null,
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
        plan_tier: p.plan_tier ?? null,
      })) as BillingProduct[];
    },
  });
}

function useCreditPacks() {
  return useQuery({
    queryKey: ["credit-packs-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_packs")
        .select("*")
        .eq("is_active", true)
        .order("credits");
      if (error) throw error;
      return data ?? [];
    },
  });
}

const TIER_ORDER: Record<string, number> = { free: 0, starter: 1, pro: 2, enterprise: 3 };

function BillingTab({ orgId, planName }: { orgId: string | undefined; planName: string | undefined }) {
  const { data: quota, isLoading: quotaLoading } = useQuotaBalance(orgId);
  const { data: products, isLoading: productsLoading } = useBillingProducts();
  const { data: packs, isLoading: packsLoading } = useCreditPacks();
  const [buyingPackId, setBuyingPackId] = useState<string | null>(null);

  // Filter out topup products
  const subscriptionPlans = (products ?? []).filter(
    (p) => !(p.name ?? "").toLowerCase().startsWith("topup") && !(p.display_name ?? "").toLowerCase().startsWith("topup")
  );

  const userTierName = (planName ?? quota?.plan_name ?? "free").toLowerCase();
  const userTierOrder = TIER_ORDER[userTierName] ?? 0;

  const subscribe = async (priceId: string) => {
    try {
      const data = await callEdgeFunction("create-checkout-session", { price_id: priceId });
      if (data?.url) {
        window.open(data.url, "_blank");
        return;
      }
      toast.error("Não foi possível redirecionar para o checkout.");
    } catch (err) {
      toast.error("Não foi possível iniciar a assinatura.");
    }
  };

  const buyCredits = async (packId: string) => {
    setBuyingPackId(packId);
    try {
      const data = await callEdgeFunction("create-topup-checkout", {
        pack_id: packId,
        org_id: orgId,
      });
      if (data?.url) {
        window.open(data.url, "_blank");
        return;
      }
      toast.error("Não foi possível redirecionar para o checkout.");
    } catch (err) {
      toast.error("Erro ao iniciar compra de créditos.");
    } finally {
      setBuyingPackId(null);
    }
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

  const displayPlanName = (planName ?? quota?.plan_name ?? "Free");
  const capitalizedPlan = displayPlanName.charAt(0).toUpperCase() + displayPlanName.slice(1);

  return (
    <div className="space-y-8">
      {/* Current plan highlight */}
      <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 max-w-2xl flex items-center gap-3">
        <div className="rounded-full bg-primary p-2">
          <CreditCard className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Seu plano atual</p>
          <p className="text-lg font-bold text-primary">{capitalizedPlan}</p>
        </div>
      </div>

      {/* Quota bar */}
      <div className="rounded-xl border bg-card p-6 shadow-sm max-w-2xl">
        <div className="flex items-center gap-1.5 mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Cotas do Plano
          </p>
          <InfoTooltip content="Todas as ações utilizam a mesma bolsa de cotas. Você pode combinar diferentes ações até consumir seu limite mensal." />
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">
          As cotas são compartilhadas entre todas as ações. Combine prompts, SaaS Specs e builds livremente.
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
              <span className="text-foreground font-semibold">{quota?.total_remaining ?? 0}</span> restantes
              {((quota?.bonus_remaining ?? 0) > 0 || (quota?.extra_credits ?? 0) > 0) && (
                <span className="text-muted-foreground text-[10px] ml-1">
                  ({quota?.plan_remaining ?? 0} plano{(quota?.bonus_remaining ?? 0) > 0 ? ` + ${quota?.bonus_remaining} bônus` : ''}{(quota?.extra_credits ?? 0) > 0 ? ` + ${quota?.extra_credits} extras` : ''})
                </span>
              )}
            </p>
            {quota?.current_period_end && (
              <p className="text-xs text-muted-foreground mt-1">
                Renova em {new Date(quota.current_period_end).toLocaleDateString("pt-BR")}
              </p>
            )}
          </>
        )}
      </div>


      {/* Credit Packs — ABOVE plans */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-bold text-foreground mb-1">Comprar Créditos Extras</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Adicione créditos extras para continuar utilizando as funcionalidades de IA.
        </p>
        {packsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
          </div>
        ) : (packs ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pacote disponível no momento.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl">
            {(packs ?? []).map((pack) => (
              <div
                key={pack.id}
                className={cn(
                  "rounded-xl border p-5 flex flex-col items-center text-center transition-colors",
                  pack.is_featured
                    ? "border-primary/40 ring-1 ring-primary/20 bg-primary/5"
                    : "border-border/60 bg-card/50"
                )}
              >
                {pack.is_featured && (
                  <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-primary-foreground uppercase tracking-wider -mt-8 mb-2">
                    ⭐ Mais popular
                  </span>
                )}
                <Coins className="h-8 w-8 text-primary mb-3" />
                <p className="text-3xl font-extrabold text-foreground">{pack.credits}</p>
                <p className="text-xs text-muted-foreground mb-2">créditos</p>
                <p className="text-lg font-bold text-foreground mb-4">
                  R$ {Number(pack.price_brl).toFixed(2).replace(".", ",")}
                </p>
                <Button
                  onClick={() => buyCredits(pack.id)}
                  disabled={buyingPackId !== null}
                  className="w-full"
                  variant={pack.is_featured ? "default" : "outline"}
                >
                  {buyingPackId === pack.id ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processando...</>
                  ) : (
                    "Comprar"
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plans — filtered, no topups, block downgrade */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-bold text-foreground mb-4">Planos disponíveis</h2>
        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-72 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl">
            {subscriptionPlans.map((plan) => {
              const planTierKey = (plan.plan_tier ?? plan.name ?? "").toLowerCase();
              const planTierOrder = TIER_ORDER[planTierKey] ?? 0;
              const isCurrent = planTierKey === userTierName;
              const isDowngrade = planTierOrder < userTierOrder;
              const canSubscribe = planTierOrder > userTierOrder;

              return (
                <div
                  key={`${plan.display_name}-${plan.sort_order}`}
                  className={cn(
                    "rounded-xl border p-5 transition-colors flex flex-col",
                    isCurrent ? "border-primary bg-primary/5 ring-2 ring-primary/40" : "border-border/60 bg-card/50",
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
                      {plan.display_name ?? plan.name ?? "Plano"}
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

                         <div className="flex items-center gap-1.5 mb-3 mt-2">
                          <p className="text-sm font-semibold text-foreground">
                            {`${plan.credits_limit} cotas / ${interval}`}
                          </p>
                          <InfoTooltip content="As ações consomem cotas do total mensal. Exemplo: 1 Build (5 cotas) equivale a 5 Prompts." />
                        </div>
                        <p className="text-[10px] text-muted-foreground mb-2">
                          Cotas compartilhadas entre todas as ações
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
                      ✅ Plano atual
                    </div>
                  ) : isDowngrade || planTierOrder === 0 ? (
                    <div className="w-full rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-center text-xs font-medium text-muted-foreground">
                      {planTierOrder === 0 ? "Plano gratuito" : "Downgrade indisponível"}
                    </div>
                  ) : canSubscribe ? (
                    <Button
                      onClick={() => subscribe(plan.stripe_price_id ?? "")}
                      disabled={!plan.stripe_price_id}
                      className="w-full"
                    >
                      Fazer Upgrade
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──
export default function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile, refetch } = useProfile(user?.id);
  const orgId = profile?.personal_org_id;

  const { data: org } = useQuery({
    queryKey: ["org-for-profile", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("plan_tier")
        .eq("id", orgId!)
        .single();
      return data;
    },
  });

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
        <AccountSidebar
          activeTab={activeTab}
          onTabChange={setTab}
          userName={profile?.full_name}
          userEmail={profile?.email}
        />

        <div className="flex-1 min-w-0">
          {activeTab === "profile" && user && (
            <ProfileTab userId={user.id} profile={profile} onRefresh={() => refetch()} />
          )}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "billing" && <BillingTab orgId={orgId} planName={org?.plan_tier} />}
        </div>
      </div>
    </AppShell>
  );
}
