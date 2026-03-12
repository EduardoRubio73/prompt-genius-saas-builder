import { useState, useCallback } from "react";
import { Check, CheckCheck, Copy } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({ text, label = "Copiar", className = "misto-copy-btn" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className={className} onClick={handleCopy} type="button">
          {copied ? (
            <span className="inline-flex items-center gap-1 text-primary">
              <CheckCheck className="h-4 w-4" />
              Copiado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Copy className="h-4 w-4" />
              {label}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {copied ? "✓ Copiado!" : "Copiar para área de transferência"}
      </TooltipContent>
    </Tooltip>
  );
}
