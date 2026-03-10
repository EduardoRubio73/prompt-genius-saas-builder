import { useState, useCallback } from "react";
import { Copy, Check, MessageCircle, Share2, Gift, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId?: string;
}

export function ShareModal({ open, onOpenChange, orgId }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const referralLink = orgId
    ? `${window.location.origin}/?ref=${orgId}`
    : `${window.location.origin}`;

  const shareText = `🚀 Conheça o Genius Engineer! Use meu link e ganhe +5 créditos grátis: ${referralLink}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [referralLink]);

  const handleWhatsApp = useCallback(() => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  }, [shareText]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Genius Engineer", text: shareText, url: referralLink });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  }, [shareText, referralLink, handleCopy]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="relative w-[90%] max-w-[360px] rounded-2xl border border-border bg-card p-6 shadow-2xl animate-fade-in">
        {/* Close */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-2 mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Gift className="h-6 w-6" />
          </div>
          <h3 className="font-heading text-lg font-bold text-foreground">Convide e Ganhe</h3>
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Compartilhe seu link e ganhe <strong className="text-foreground">+5 créditos</strong> quando seu amigo ativar um plano!
          </p>
        </div>

        {/* Link input */}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 p-2 mb-4">
          <input
            readOnly
            value={referralLink}
            className="flex-1 min-w-0 bg-transparent text-xs text-foreground font-mono truncate outline-none"
          />
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-1 shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
              copied
                ? "bg-green-500/15 text-green-600 dark:text-green-400"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-green-500/10 py-2.5 text-xs font-semibold text-green-700 dark:text-green-400 hover:bg-green-500/20 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </button>
          <button
            onClick={handleNativeShare}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-primary/10 py-2.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Compartilhar
          </button>
        </div>
      </div>
    </div>
  );
}
