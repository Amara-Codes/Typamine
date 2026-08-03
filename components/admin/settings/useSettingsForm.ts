"use client";

import { useActionState, useEffect, useRef, useState } from "react";

type SettingsAction = (prevState: string | null, formData: FormData) => Promise<string | null>;

// Wraps useActionState with the "just saved" flash used by every settings
// form — useActionState alone can't tell "not submitted yet" apart from
// "submitted successfully" (both have errorMessage === null), so the flag is
// derived from the isPending true -> false transition instead.
export function useSettingsForm(action: SettingsAction) {
  const [errorMessage, dispatch, isPending] = useActionState(action, null);
  const [justSaved, setJustSaved] = useState(false);
  const wasPendingRef = useRef(false);

  useEffect(() => {
    if (wasPendingRef.current && !isPending && !errorMessage) {
      setJustSaved(true);
      const timeout = setTimeout(() => setJustSaved(false), 3000);
      wasPendingRef.current = isPending;
      return () => clearTimeout(timeout);
    }
    wasPendingRef.current = isPending;
  }, [isPending, errorMessage]);

  return { errorMessage, dispatch, isPending, justSaved };
}
