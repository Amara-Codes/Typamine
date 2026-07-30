// Placeholder FontAuthor: assegnati automaticamente ai font all'import (single
// upload locale, bulk upload locale, provider Google Fonts/Fontshare) quando
// non c'e' un autore reale noto. La loro presenza su un font.authorId e' uno
// dei due segnali che triggerano il pulsante "Resolve Font Identity with AI"
// in dashboard (vedi lib/actions/font.ts - hasFontsNeedingIdentityDetection).
export type PlaceholderFontAuthorKey =
  | "localSingleImport"
  | "localBulkImport"
  | "googleFonts"
  | "fontshare";

interface PlaceholderFontAuthorDef {
  slug: string;
  name: string;
  email: string;
}

export const PLACEHOLDER_FONT_AUTHORS: Record<PlaceholderFontAuthorKey, PlaceholderFontAuthorDef> = {
  localSingleImport: {
    slug: "local-single-import-placeholder-author",
    name: "Local Single Import Placeholder Author",
    email: "local-single-import@placeholder.typamine.internal",
  },
  localBulkImport: {
    slug: "local-bulk-import-placeholder-author",
    name: "Local Bulk Import Placeholder Author",
    email: "local-bulk-import@placeholder.typamine.internal",
  },
  googleFonts: {
    slug: "google-fonts-placeholder-author",
    name: "Google Fonts Placeholder Author",
    email: "google-fonts@placeholder.typamine.internal",
  },
  fontshare: {
    slug: "fontshare-placeholder-author",
    name: "Fontshare Placeholder Author",
    email: "fontshare@placeholder.typamine.internal",
  },
};

export const PLACEHOLDER_FONT_AUTHOR_SLUGS: string[] = Object.values(PLACEHOLDER_FONT_AUTHORS).map((a) => a.slug);
