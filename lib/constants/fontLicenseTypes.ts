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
