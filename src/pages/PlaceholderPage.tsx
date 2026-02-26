import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/AppShell";

export default function PlaceholderPage({ title }: { title: string }) {
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h1 className="font-heading text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-muted-foreground">Em breve disponível.</p>
        <Button variant="outline" className="mt-6" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Dashboard
        </Button>
      </div>
    </AppShell>
  );
}
