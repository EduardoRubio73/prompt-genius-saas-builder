import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";

export default function BillingSuccess() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile(user?.id);

  return (
    <AppShell
      userName={profile?.full_name}
      userEmail={profile?.email}
      avatarUrl={profile?.avatar_url}
      onSignOut={signOut}
    >
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        <div className="rounded-full bg-primary/10 p-4">
          <CheckCircle className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Pagamento realizado com sucesso!</h1>
        <p className="text-muted-foreground max-w-md">
          Seus créditos serão adicionados automaticamente à sua conta em instantes.
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link to="/dashboard">Ir para o Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/profile?tab=billing">Ver meu plano</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
