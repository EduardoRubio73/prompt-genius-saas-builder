import logo from "@/assets/logo.png";

export default function AuthBrand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="text-center">
      <img src={logo} alt="Genius" className="mx-auto mb-4 h-24 w-auto" />
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Entrar no Genius
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {subtitle ?? "Plataforma inteligente de gestão e análise de conversas"}
      </p>
    </div>
  );
}
