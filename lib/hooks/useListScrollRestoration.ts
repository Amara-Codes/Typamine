"use client";

import { useEffect } from "react";

// Sotto questa larghezza consideriamo "mobile" — su desktop lo scroll delle
// pagine di listato e' gia' ridotto/gestibile, e Next.js App Router non ha
// un ripristino scroll nativo affidabile lato back/forward (il contenuto
// dietro Suspense monta dopo che il browser ha gia' tentato il proprio
// scroll-restore), quindi qui lo facciamo a mano SOLO dove serve davvero.
const MOBILE_BREAKPOINT = 768;

const STORAGE_PREFIX = "tm_scroll_";

function isMobileViewport(): boolean {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function currentKey(): string {
  return `${STORAGE_PREFIX}${window.location.pathname}${window.location.search}`;
}

// Flag globale (modulo, non state React): true solo se l'ultima navigazione
// e' arrivata da un back/forward del browser (popstate), non da un click su
// un Link o una paginazione. Serve a distinguere "torno da /ingredients/foo
// dopo Indietro" (ripristina) da "sono arrivato qui cliccando un link nuovo"
// (non ripristinare una posizione vecchia rimasta in sessionStorage).
let cameFromPopState = false;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    cameFromPopState = true;
  });
}

/**
 * Da usare nello shell stabile (il "Client.tsx" che non smonta mai tra un
 * cambio filtro/pagina) delle pagine di listato pubbliche (ingredients,
 * pills, archive, prescriptions, formulas). Su mobile: salva la scroll
 * position in sessionStorage ad ogni scroll (chiave = pathname+querystring
 * corrente, letta al volo, cosi' resta corretta anche se l'utente pagina
 * senza far smontare questo componente), e la ripristina al mount SOLO se
 * si e' arrivati qui con "Indietro" dal browser — non su una navigazione
 * normale via link/paginazione, dove il componente comunque non rismonta.
 */
export function useListScrollRestoration() {
  // Effetto di salvataggio: monta una volta sola, legge pathname/search al
  // momento dello scroll (non li cattura in chiusura) cosi' resta valido
  // anche attraverso i cambi di query senza remount di questo componente.
  useEffect(() => {
    if (!isMobileViewport()) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        try {
          sessionStorage.setItem(currentKey(), String(window.scrollY));
        } catch {
          // sessionStorage puo' non essere disponibile (private mode/quota) — non e' fatale, si perde solo il ripristino.
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Effetto di ripristino: gira solo al vero mount del componente (quando si
  // torna da una pagina di dettaglio, non ad ogni cambio filtro/pagina).
  useEffect(() => {
    if (!isMobileViewport()) return;
    if (!cameFromPopState) return;

    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(currentKey());
    } catch {
      return;
    }
    if (saved === null) return;

    // Consumato subito: un click normale (non back) su questa stessa pagina
    // non deve ri-scattare il ripristino.
    cameFromPopState = false;

    // Un frame dopo il mount: il contenuto dentro Suspense deve aver finito
    // di misurarsi, altrimenti scrollTo atterra su un layout ancora
    // incompleto (altezza pagina piu' bassa di quella reale).
    requestAnimationFrame(() => {
      window.scrollTo(0, parseInt(saved!, 10));
    });
  }, []);
}
