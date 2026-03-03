import { CheckCircle2, XCircle } from "lucide-react";

export function PlanBadge({ tier }: { tier: string | null }) {
  const t = tier || "free";
  return (
    <span className={`adm-badge ${t}`}>
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
    <span className="adm-badge active">
      <CheckCircle2 size={12} />
      {labelTrue}
    </span>
  ) : (
    <span className="adm-badge inactive">
      <XCircle size={12} />
      {labelFalse}
    </span>
  );
}

export function SubStatusBadge({ status }: { status: string }) {
  const classMap: Record<string, string> = {
    active: "active",
    trialing: "starter",
    past_due: "enterprise",
    canceled: "inactive",
    paused: "enterprise",
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
    <span className={`adm-badge ${classMap[status] || "free"}`}>
      {labels[status] || status}
    </span>
  );
}

export function DestinoBadge({ destino }: { destino: string | null }) {
  if (!destino) return <span className="adm-badge free">—</span>;
  const classMap: Record<string, string> = {
    lovable: "lovable",
    chatgpt: "chatgpt",
    claude: "claude",
    cursor: "starter",
    gemini: "enterprise",
    v0: "pro",
  };
  return (
    <span className={`adm-badge ${classMap[destino] || "free"}`}>
      {destino}
    </span>
  );
}
