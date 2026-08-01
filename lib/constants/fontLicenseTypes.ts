// Valori ammessi per Ingredient.licenseType. Condivisi tra il form admin
// (select manuale) e l'AI (Gemini vincolato a scegliere solo tra questi via
// responseSchema enum, stesso pattern di lib/ai/fontRating.ts per i tag).
export const FONT_LICENSE_TYPES = [
  "Free",
  "Free for Personal Use",
  "Demo",
  "Donationware",
  "Public Domain",
  "Open Source (SIL OFL)",
  "Commercial",
] as const;

export type FontLicenseType = (typeof FONT_LICENSE_TYPES)[number];

// Stato TERMINALE per Ingredient.licenseType, parallelo a
// UNKNOWN_AFTER_AI_CHECK_FONT_AUTHOR: l'AI (detectFontIdentityWithAI) puo'
// rispondere "Unknown" invece di forzare una licenza indovinata — quando lo
// fa, salviamo questo valore invece di lasciare licenseType null/vuoto,
// cosi' il font non viene ririchiesto a ogni giro (non e' uno dei
// FONT_LICENSE_TYPES "reali": non compare nel select del form admin).
export const UNKNOWN_AFTER_AI_CHECK_LICENSE = "Unknown (AI Checked)";
