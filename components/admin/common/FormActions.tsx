"use client";

import { useFormStatus } from "react-dom";
import { MoveLeft, Save, Loader2 } from "lucide-react";
import MinimalLink from "@/components/common/MinimalLink";
import { Button } from "@/components/common/Button";

interface FormActionsProps {
  backLink: string;
  backLabel?: string;
  buttonLabel?: string;
  disabled?: boolean;
}

export default function FormActions({ 
  backLink, 
  backLabel = "Back to list", 
  buttonLabel = "Save Changes",
  disabled = false
}: FormActionsProps) {
  const { pending } = useFormStatus();

  return (
    <div className="flex items-center justify-between">
      <MinimalLink 
        href={backLink} 
        label={backLabel}
        icon={<MoveLeft className="h-4 w-4 icon-altalenante" />}
        iconPosition="left"
        className="font-bold uppercase tracking-widest text-zinc-300 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
      />
      
      <Button
        type="submit"
        disabled={pending || disabled}
        variant="themeResponsive"
        size="md"
        roundness="md"
        className="min-w-[140px] flex items-center gap-2"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {pending ? "Saving..." : buttonLabel}
      </Button>
    </div>
  );
}
