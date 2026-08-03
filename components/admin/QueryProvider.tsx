"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Un solo QueryClient per tutta la sessione admin — useState (non un valore
// creato fuori dal componente) evita che venga condiviso tra utenti/richieste
// diverse in SSR, e non viene ricreato ad ogni render lato client.
export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
