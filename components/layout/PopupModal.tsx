"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import BaseModal from "@/components/common/BaseModal";
import { Button } from "@/components/common/Button";
import { AdminSettings } from "@/types";

const COOKIE_NAME = "typamine_popup_last_shown";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// max-age lungo e fisso (2 anni): la scadenza del cookie non è ciò che
// determina se la popup ri-appare — quello lo decide il confronto tra il
// timestamp salvato e popupFrequencyDays fatto in shouldShowPopup. Il cookie
// deve solo sopravvivere abbastanza a lungo da non essere mai il collo di
// bottiglia rispetto alla frequenza scelta in admin.
function setCookie(name: string, value: string) {
  const maxAgeSeconds = 60 * 60 * 24 * 365 * 2;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function shouldShowPopup(settings: AdminSettings): boolean {
  if (settings.popupFrequency === "every_visit") return true;

  const lastShown = getCookie(COOKIE_NAME);
  if (!lastShown) return true; // "first_visit" o "periodic" senza cookie ancora -> prima volta

  if (settings.popupFrequency === "first_visit") return false; // già mostrata una volta, mai più

  // "periodic"
  const lastShownMs = Date.parse(lastShown);
  if (Number.isNaN(lastShownMs)) return true;
  const elapsedDays = (Date.now() - lastShownMs) / (1000 * 60 * 60 * 24);
  return elapsedDays >= settings.popupFrequencyDays;
}

interface PopupModalProps {
  settings: AdminSettings;
}

// Popup promozionale homepage — indipendente dal marquee (che ha il suo
// popupActive/marqueeType separato), gated solo su settings.popupActive. La
// logica di frequenza è interamente client-side via cookie, coerente con
// quanto spiegato all'admin nel tab Promo Website Communication.
export default function PopupModal({ settings }: PopupModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!settings.popupActive) return;
    if (!settings.popupHeadline && !settings.popupMessage && !settings.popupImageUrl) return;
    if (!shouldShowPopup(settings)) return;

    setIsOpen(true);
    setCookie(COOKIE_NAME, new Date().toISOString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.popupActive]);

  if (!settings.popupActive) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg">
      <BaseModal.Header onClose={() => setIsOpen(false)}>{null}</BaseModal.Header>
      <BaseModal.Body className="space-y-5 text-center">
        {settings.popupImageUrl && (
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden">
            <Image src={settings.popupImageUrl} alt={settings.popupHeadline || "Promo"} fill className="object-cover" />
          </div>
        )}
        {settings.popupHeadline && (
          <h3 className="font-star text-2xl sm:text-3xl text-black dark:text-white">{settings.popupHeadline}</h3>
        )}
        {settings.popupMessage && (
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{settings.popupMessage}</p>
        )}
        {settings.popupCtaLabel && (
          <Link href={(settings.popupCtaLink || "/") as any} onClick={() => setIsOpen(false)}>
            <Button variant="primary" size="lg">
              {settings.popupCtaLabel}
            </Button>
          </Link>
        )}
      </BaseModal.Body>
    </BaseModal>
  );
}
