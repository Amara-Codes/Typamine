import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/common/Button";

interface SaveBarProps {
  errorMessage: string | null;
  isPending: boolean;
  justSaved: boolean;
  label?: string;
}

export function SaveBar({ errorMessage, isPending, justSaved, label = "Save Changes" }: SaveBarProps) {
  return (
    <>
      {errorMessage && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-red-500/10 text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="text-xs font-haas leading-relaxed">{errorMessage}</p>
        </div>
      )}
      <div className="flex items-center justify-end gap-3 pt-2">
        {justSaved && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-green-500">
            <CheckCircle2 className="h-4 w-4" />
            Saved
          </span>
        )}
        <Button type="submit" variant="primary" disabled={isPending} className="flex items-center gap-2">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isPending ? "Saving..." : label}
        </Button>
      </div>
    </>
  );
}

export default SaveBar;
