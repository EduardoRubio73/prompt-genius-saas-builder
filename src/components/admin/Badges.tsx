import { CheckCircle2, XCircle } from "lucide-react";

export function PlanBadge({ tier }: { tier: string | null }) {
  const styles: Record<string, string> = {
    pro: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    starter: "bg-blue-500/12 text-blue-400 border-blue-500/25",
    enterprise: "bg-orange-500/12 text-orange-400 border-orange-500/25",
    free: "bg-white/[0.08] text-white/65 border-white/10",
  };
  const t = tier || "free";
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize ${styles[t] ?? styles.free}`}>
      {t}
    </span>
  );
}

export function StatusBadge({
  active,
  labelTrue = "Ativo",
  labelFalse = "Inativo",
}: {
  active: boolean;
  labelTrue?: string;
  labelFalse?: string;
}) {
  return active ? (
    <span className="inline-flex items-center gap-1 rounded-md border border-green-500/20 bg-green-500/12 px-2 py-0.5 text-[11px] font-medium text-green-400">
      <CheckCircle2 className="h-3 w-3" />
      {labelTrue}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md border border-red-500/25 bg-red-500/12 px-2 py-0.5 text-[11px] font-medium text-red-400">
      <XCircle className="h-3 w-3" />
      {labelFalse}
    </span>
  );
}

export function SubStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-500/12 text-green-400 border-green-500/20",
    trialing: "bg-blue-500/12 text-blue-400 border-blue-500/25",
    past_due: "bg-yellow-500/12 text-yellow-400 border-yellow-500/25",
    canceled: "bg-red-500/12 text-red-400 border-red-500/25",
    paused: "bg-yellow-500/12 text-yellow-400 border-yellow-500/25",
  };
  const labels: Record<string, string> = {
    active: "Ativo",
    trialing: "Trial",
    past_due: "Inadimplente",
    canceled: "Cancelado",
    paused: "Pausado",
    incomplete: "Incompleto",
    unpaid: "Não pago",
  };
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${styles[status] || "bg-white/[0.05] text-white/50 border-white/10"}`}>
      {labels[status] || status}
    </span>
  );
}
