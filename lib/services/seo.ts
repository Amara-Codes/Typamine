import prisma from "@/lib/prisma";
import { SeoModule } from "@/types";

export function toSeoModule(record: any | null | undefined): SeoModule | undefined {
  if (!record) return undefined;
  return {
    id: record.id,
    metaTitle: record.metaTitle ?? undefined,
    metaDescription: record.metaDescription ?? undefined,
    keywords: record.keywords ?? undefined,
    ogTitle: record.ogTitle ?? undefined,
    ogDescription: record.ogDescription ?? undefined,
    ogImageUrl: record.ogImageUrl ?? undefined,
    ogImageAlt: record.ogImageAlt ?? undefined,
    twitterCard: (record.twitterCard as SeoModule["twitterCard"]) ?? undefined,
    twitterTitle: record.twitterTitle ?? undefined,
    twitterDescription: record.twitterDescription ?? undefined,
    twitterImageUrl: record.twitterImageUrl ?? undefined,
    twitterImageAlt: record.twitterImageAlt ?? undefined,
    canonicalUrl: record.canonicalUrl ?? undefined,
    noIndex: record.noIndex ?? undefined,
  };
}

export interface SeoModuleWriteData {
  metaTitle?: string | null;
  metaDescription?: string | null;
  keywords?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageUrl?: string | null;
  ogImageAlt?: string | null;
  twitterCard?: string;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImageUrl?: string | null;
  twitterImageAlt?: string | null;
  canonicalUrl?: string | null;
  noIndex?: boolean;
}

// Legge i campi SEO da una FormData in modo "opt-in per campo": un campo
// assente dalla form (es. Pairing, che non ha ancora una tab SEO) resta
// `undefined` — che per Prisma `update()` significa "non toccare questo
// campo", non "svuotalo". Solo un campo esplicitamente inviato vuoto diventa
// `null` (cancellazione esplicita).
export function parseSeoFormFields(formData: FormData): SeoModuleWriteData {
  const str = (key: string): string | null | undefined => {
    const raw = formData.get(key);
    if (raw === null) return undefined;
    const trimmed = (raw as string).trim();
    return trimmed || null;
  };

  return {
    metaTitle: str("seoMetaTitle"),
    metaDescription: str("seoMetaDescription"),
    keywords: str("seoKeywords"),
    ogTitle: str("seoOgTitle"),
    ogDescription: str("seoOgDescription"),
    ogImageAlt: str("seoOgImageAlt"),
    twitterTitle: str("seoTwitterTitle"),
    twitterDescription: str("seoTwitterDescription"),
    twitterImageAlt: str("seoTwitterImageAlt"),
    canonicalUrl: str("seoCanonicalUrl"),
    twitterCard: formData.has("seoTwitterCard") ? (formData.get("seoTwitterCard") as string) : undefined,
    noIndex: formData.has("seoNoIndex") ? formData.get("seoNoIndex") === "true" : undefined,
  };
}

// Crea o aggiorna il SeoModule collegato a un contenuto. `fallbackImageUrl` è
// l'immagine "di scorta" del contenuto stesso (thumbnail per ArchivePost,
// immagine canvas/upload per Pairing): se l'admin non ha assegnato/rimosso
// esplicitamente un'immagine OG o Twitter, il modulo SEO eredita quella —
// niente social card vuote di default.
export async function upsertSeoModule(
  existingSeoId: string | null | undefined,
  data: SeoModuleWriteData,
  options: {
    fallbackImageUrl?: string | null;
    ogImageUrl?: string | null;
    ogImageRemoved?: boolean;
    twitterImageUrl?: string | null;
    twitterImageRemoved?: boolean;
  } = {}
): Promise<string> {
  const { fallbackImageUrl, ogImageUrl, ogImageRemoved, twitterImageUrl, twitterImageRemoved } = options;

  const writeData: SeoModuleWriteData = { ...data };

  if (ogImageUrl) {
    writeData.ogImageUrl = ogImageUrl;
  } else if (ogImageRemoved) {
    writeData.ogImageUrl = fallbackImageUrl || null;
  }

  if (twitterImageUrl) {
    writeData.twitterImageUrl = twitterImageUrl;
  } else if (twitterImageRemoved) {
    writeData.twitterImageUrl = fallbackImageUrl || null;
  }

  if (existingSeoId) {
    const existing = await prisma.seoModule.findUnique({ where: { id: existingSeoId }, select: { ogImageUrl: true, twitterImageUrl: true } });
    // Prima assegnazione automatica: il modulo non ha mai avuto un'immagine
    // OG/Twitter propria (né una rimossa esplicitamente ora) — la eredita
    // dal fallback invece di restare vuoto.
    if (!existing?.ogImageUrl && writeData.ogImageUrl === undefined && fallbackImageUrl) {
      writeData.ogImageUrl = fallbackImageUrl;
    }
    if (!existing?.twitterImageUrl && writeData.twitterImageUrl === undefined && fallbackImageUrl) {
      writeData.twitterImageUrl = fallbackImageUrl;
    }

    await prisma.seoModule.update({ where: { id: existingSeoId }, data: writeData });
    return existingSeoId;
  }

  if (writeData.ogImageUrl === undefined && fallbackImageUrl) writeData.ogImageUrl = fallbackImageUrl;
  if (writeData.twitterImageUrl === undefined && fallbackImageUrl) writeData.twitterImageUrl = fallbackImageUrl;

  const created = await prisma.seoModule.create({ data: writeData as any });
  return created.id;
}
