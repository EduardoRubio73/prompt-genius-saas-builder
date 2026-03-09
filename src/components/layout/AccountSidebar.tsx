import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, User, Lock, Bell, CreditCard, Gift, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TABS = [
  { key: "profile", label: "Perfil", icon: User },
  { key: "security", label: "Segurança", icon: Lock },
  { key: "notifications", label: "Notificações", icon: Bell },
  { key: "billing", label: "Plano & Cobrança", icon: CreditCard },
] as const;

export type AccountTabKey = (typeof TABS)[number]["key"];

function buildSupportMailto(name: string, email: string) {
  const now = new Date().toLocaleString("pt-BR");
  const subject = encodeURIComponent(`À equipe de suporte da Genius - ${name || "Usuário"}`);
  const body = encodeURIComponent(
    `Olá equipe de suporte,\n\nUsuário: ${name || "N/A"}\nEmail: ${email}\nData: ${now}\n\nDescreva sua dúvida ou problema:\n\n`
  );
  return `mailto:zragencyia@gmail.com?subject=${subject}&body=${body}`;
}

const linkClass =
  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left whitespace-nowrap shrink-0";

interface AccountSidebarProps {
  activeTab?: AccountTabKey | null;
  onTabChange?: (tab: AccountTabKey) => void;
  userName?: string | null;
  userEmail?: string | null;
  /** Highlight "Indicações" as active */
  indicacoesActive?: boolean;
}

export function AccountSidebar({
  activeTab,
  onTabChange,
  userName,
  userEmail,
  indicacoesActive,
}: AccountSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSupportDialog, setShowSupportDialog] = useState(false);

  const handleConfirmSupport = () => {
    setShowSupportDialog(false);
    window.location.href = buildSupportMailto(userName ?? "", userEmail ?? "");
  };

  return (
    <>
      <nav className="flex sm:flex-col gap-1 sm:w-48 shrink-0 overflow-x-auto pb-2 sm:pb-0 sm:overflow-x-visible">
        <button
          onClick={() => navigate("/dashboard")}
          className={cn(linkClass, "text-muted-foreground hover:bg-muted hover:text-foreground")}
        >
          <LayoutDashboard className="h-4 w-4" /> Dashboard
        </button>
        <div className="hidden sm:block border-b sm:my-1" />
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                if (location.pathname !== "/profile") {
                  navigate(`/profile?tab=${tab.key}`);
                } else {
                  onTabChange?.(tab.key);
                }
              }}
              className={cn(
                linkClass,
                activeTab === tab.key && !indicacoesActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" /> {tab.label}
            </button>
          );
        })}
        <div className="hidden sm:block border-b sm:my-1" />
        <button
          onClick={() => navigate("/indicacoes")}
          className={cn(
            linkClass,
            indicacoesActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Gift className="h-4 w-4" /> Indicações
        </button>
        <div className="hidden sm:block border-b sm:my-1" />
        <button
          onClick={() => setShowSupportDialog(true)}
          className={cn(linkClass, "text-muted-foreground hover:bg-muted hover:text-foreground")}
        >
          <Mail className="h-4 w-4" /> Suporte
        </button>
      </nav>

      <AlertDialog open={showSupportDialog} onOpenChange={setShowSupportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar email ao suporte?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao confirmar, seu aplicativo de email será aberto com uma mensagem pré-preenchida para a equipe de suporte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSupport}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
