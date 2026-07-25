"use client";

import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { MoveLeft, Save, Loader2 } from "lucide-react";
import MinimalLink from "@/components/common/MinimalLink";
import { Button } from "@/components/common/Button";

interface FormActionsProps {
  backLink: string;
  backLabel?: string;
  buttonLabel?: string;
  disabled?: boolean;
  buttonSize?: "sm" | "md" | "lg";
  showButton?: boolean;
  children?: React.ReactNode;
}

export default function FormActions({
  backLink,
  backLabel = "Back to list",
  buttonLabel = "Save Changes",
  disabled = false,
  buttonSize = "lg",
  showButton = true,
  children,
}: FormActionsProps) {
  const { pending } = useFormStatus();
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <MinimalLink
        href={backLink}
        label={backLabel}
        icon={<MoveLeft className="h-4 w-4" />}
        iconPosition="left"
        className="ml-4 font-bold uppercase tracking-widest text-bluegray-800 dark:text-redgray-200 hover:text-black dark:hover:text-white"
        onClick={(e) => {
          // router.back() torna esattamente alla pagina di listato con
          // pagina/ricerca/filtri con cui l'utente era arrivato al form —
          // href resta come fallback (nuova scheda, o nessuna history da cui
          // tornare, es. link diretto), ma qui preveniamo la navigazione
          // "fresca" che altrimenti riparte sempre da pagina 1 senza filtri.
          if (window.history.length > 1) {
            e.preventDefault();
            router.back();
          }
        }}
      />

      <div className="flex items-center gap-3">
        {children}

        {showButton && (
          <Button
            type="submit"
            disabled={pending || disabled}
            variant="primary"
            size={buttonSize}
            roundness="md"
            className="flex items-center gap-2"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {pending ? "Saving..." : buttonLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
