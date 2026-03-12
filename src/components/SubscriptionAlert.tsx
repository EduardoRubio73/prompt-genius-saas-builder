import { useEffect } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useOrgSubscription } from "@/hooks/useOrgSubscription";
import { useQuotaBalance } from "@/hooks/useQuotaBalance";
import { callEdgeFunction } from "@/lib/edgeFunctions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: "Ativo", color: "text-green-600 dark:text-green-400" },
  trialing: { label: "Em teste", color: "text-blue-600 dark:text-blue-400" },
  past_due: { label: "Pendente", color: "text-yellow-600 dark:text-yellow-400" },
  canceled: { label: "Cancelado", color: "text-red-600 dark:text-red-400" },
  incomplete_expired: { label: "Expirado", color: "text-red-600 dark:text-red-400" },
  none: { label: "Inativo", color: "text-muted-foreground" },
};

export function getSubscriptionStatusInfo(status: string | undefined | null) {
  return STATUS_MAP[status ?? "none"] ?? STATUS_MAP.none;
}

export function isSubscriptionExpired(subscription: { status: string; current_period_end?: string | null } | undefined | null): boolean {
  if (!subscription) return false;
  if (subscription.status === "canceled" || subscription.status === "incomplete_expired") return true;
  if (subscription.status === "past_due") return true;
  if (subscription.current_period_end) {
    return new Date(subscription.current_period_end) < new Date();
  }
  return false;
}

export function isRenewalSoon(subscription: { current_period_end?: string | null } | undefined | null): boolean {
  if (!subscription?.current_period_end) return false;
  const end = new Date(subscription.current_period_end);
  const now = new Date();
  const daysLeft = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return daysLeft <= 7 && daysLeft >= 0;
}

export function getDaysUntilRenewal(subscription: { current_period_end?: string | null } | undefined | null): number | null {
  if (!subscription?.current_period_end) return null;
  const end = new Date(subscription.current_period_end);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

interface SubscriptionAlertProps {
  orgId: string | undefined;
  showToast?: boolean;
  compact?: boolean;
}

export function SubscriptionAlert({ orgId, showToast = false, compact = false }: SubscriptionAlertProps) {
  const { data: subscription } = useOrgSubscription(orgId);
  const { data: quota } = useQuotaBalance(orgId);

  const expired = isSubscriptionExpired(subscription);
  const soon = isRenewalSoon(subscription);
  const daysLeft = getDaysUntilRenewal(subscription);

  const totalRemaining = (quota?.credits_remaining ?? 0) + (quota?.bonus_remaining ?? 0) + (quota?.extra_credits ?? 0);

  useEffect(() => {
    if (showToast && expired) {
      if (totalRemaining > 0) {
        toast.warning("Sua assinatura está vencida. Você ainda tem saldo, mas renove para continuar usando.", { duration: 8000, id: "sub-expired" });
      } else {
        toast.error("Sua assinatura está vencida e sem saldo. Renove para continuar.", { duration: 10000, id: "sub-expired-no-credits" });
      }
    }
  }, [showToast, expired, totalRemaining]);

  if (!expired && !soon) return null;

  const openPortal = async () => {
    try {
      const data = await callEdgeFunction("create-billing-portal", {
        org_id: orgId,
        return_url: window.location.href,
      });
      if (data?.url) window.open(data.url, "_blank");
      else toast.error("Não foi possível abrir o portal.");
    } catch {
      toast.error("Erro ao abrir o portal de assinaturas.");
    }
  };

  if (compact) {
    return (
      <button
        onClick={openPortal}
        className={cn(
          "w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors cursor-pointer flex items-center gap-2",
          expired
            ? "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20"
            : "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20"
        )}
      >
        <AlertTriangle className="h-4 w-4 shrink-0" />
        {expired
          ? totalRemaining > 0
            ? "⚠️ Assinatura vencida — saldo restante disponível. Renove agora."
            : "🚨 Assinatura vencida e sem saldo. Clique para renovar."
          : `⏰ Renovação em ${daysLeft} dia${daysLeft !== 1 ? "s" : ""}. Clique para gerenciar.`}
        <ExternalLink className="h-3.5 w-3.5 ml-auto shrink-0" />
      </button>
    );
  }

  return (
    <Alert variant="destructive" className={cn(
      "cursor-pointer",
      expired ? "border-red-500/40 bg-red-500/10" : "border-yellow-500/40 bg-yellow-500/10"
    )} onClick={openPortal}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {expired ? "Assinatura vencida" : "Renovação próxima"}
      </AlertTitle>
      <AlertDescription className="flex items-center gap-2">
        {expired
          ? totalRemaining > 0
            ? "Sua assinatura está vencida. Você ainda tem saldo disponível, mas renove para não perder acesso."
            : "Sua assinatura está vencida e sem saldo. Renove agora para continuar usando a plataforma."
          : `Sua assinatura renova em ${daysLeft} dia${daysLeft !== 1 ? "s" : ""}. Clique para gerenciar.`}
        <Button variant="outline" size="sm" className="ml-auto gap-1 shrink-0">
          Renovar <ExternalLink className="h-3 w-3" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
