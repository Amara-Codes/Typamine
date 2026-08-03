"use client";

import { useEffect, ReactNode } from "react";
import { useInView } from "react-intersection-observer";

interface InViewTriggerProps {
  onVisible: () => void;
  children: ReactNode;
}

// Wrapper usato per il fetch progressivo allo scroll nei picker
// (FontPicker/TagPicker): quando l'elemento posizionato a metà dell'ultimo
// batch fetchato entra in viewport, richiede la pagina successiva in anticipo
// invece di aspettare che l'utente arrivi in fondo alla lista.
//
// NB: niente `display: contents` sul div a cui è agganciato il ref — un
// elemento con `display: contents` non genera una propria box di layout, quindi
// il suo `getBoundingClientRect()` è degenere (0x0) e IntersectionObserver non
// lo considera mai "in view" (bug scoperto: lo scroll non fetchava mai oltre
// il primo batch). Il div qui sotto è un blocco normale a piena larghezza —
// visivamente identico dato che i bottoni figli sono già `w-full`.
export default function InViewTrigger({ onVisible, children }: InViewTriggerProps) {
  const { ref, inView } = useInView({ triggerOnce: false });

  useEffect(() => {
    if (inView) onVisible();
  }, [inView, onVisible]);

  return <div ref={ref}>{children}</div>;
}
