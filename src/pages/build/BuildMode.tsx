import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditModal } from "@/components/misto/CreditModal";
import { useQuotaBalance } from "@/hooks/useQuotaBalance";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Rocket, Lock } from "lucide-react";
import { toast } from "sonner";

const BUILD_STEPS = [
  "Produto", "Público", "Features", "Modelo de Receita",
  "Stack", "Infra", "Auth & Permissões", "Admin",
  "Integrações", "Branding"
];

const BuildMode = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: quota } = useQuotaBalance(profile?.personal_org_id);

  const hasCredits = quota && quota.total_remaining >= 5;

  const handleStart = () => {
    if (!hasCredits) {
      setShowCreditModal(true);
      return;
    }
    toast.info("🚀 Modo BUILD iniciado!");
  };

  return (
    <AppShell>
      <div className="container mx-auto max-w-4xl py-8 px-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Rocket className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Modo BUILD</h1>
          </div>
          <p className="text-muted-foreground">
            Transforme sua ideia em um pacote técnico completo para construção de SaaS.
          </p>
          <p className="text-sm text-muted-foreground">
            Custo: 5 cotas por projeto
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Etapas do BUILD Engine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {BUILD_STEPS.map((step, i) => (
                <div
                  key={step}
                  className={`text-center text-xs p-2 rounded-md border ${
                    i === currentStep
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {i + 1}. {step}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          {hasCredits ? (
            <Button size="lg" onClick={handleStart} className="gap-2">
              <Rocket className="h-4 w-4" />
              Iniciar BUILD
            </Button>
          ) : (
            <Button size="lg" variant="outline" onClick={() => setShowCreditModal(true)} className="gap-2">
              <Lock className="h-4 w-4" />
              Cotas insuficientes — Ver planos
            </Button>
          )}
        </div>
      </div>

      {showCreditModal && (
        <CreditModal
          type="no_credits"
          onClose={() => setShowCreditModal(false)}
        />
      )}
    </AppShell>
  );
};

export default BuildMode;
