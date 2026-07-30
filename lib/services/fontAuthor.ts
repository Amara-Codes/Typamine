import { unstable_cache, revalidatePath, revalidateTag } from "next/cache";
import prisma from "@/lib/prisma";
import { FontAuthor } from "@/types";
import { withSafeDbQuery } from "./dbMigration";
import { CACHE_TAGS } from "@/lib/cacheTags";
import { PLACEHOLDER_FONT_AUTHORS, PlaceholderFontAuthorKey } from "@/lib/constants/placeholderFontAuthors";
import crypto from "crypto";

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const DEFAULT_METRICS = {
  totalFontsCount: 0,
  totalDownloads: 0,
  followersCount: 0,
  usersRating: { average: 0, totalReviews: 0 },
};

// totalFontsCount e usersRating non sono presi dal JSON `metrics` salvato: si
// ricalcolano al volo dai font collegati (Ingredient.userRating/userRatingsCount),
// così restano sempre corretti senza bisogno di un job che li aggiorni.
// totalDownloads/followersCount restano dal JSON — nessuna feature li traccia ancora.
function computeLiveAuthorStats(fonts: { userRating: number | null; userRatingsCount: number | null }[]) {
  let totalReviews = 0;
  let weightedSum = 0;
  for (const f of fonts) {
    const count = f.userRatingsCount ?? 0;
    totalReviews += count;
    weightedSum += (f.userRating ?? 0) * count;
  }
  return {
    totalFontsCount: fonts.length,
    usersRating: {
      average: totalReviews > 0 ? weightedSum / totalReviews : 0,
      totalReviews,
    },
  };
}

export function mapFontAuthor(rec: any): FontAuthor {
  const storedMetrics = safeParse(rec.metrics, DEFAULT_METRICS);
  const liveStats = Array.isArray(rec.fonts) ? computeLiveAuthorStats(rec.fonts) : null;

  return {
    id: rec.id,
    slug: rec.slug,
    name: rec.name,
    type: rec.type ?? "UNKNOWN",
    email: rec.email,
    supportEmail: rec.supportEmail ?? undefined,
    avatarUrl: rec.avatarUrl ?? undefined,
    bannerUrl: rec.bannerUrl ?? undefined,
    bio: rec.bio ?? undefined,
    website: rec.website ?? undefined,
    donation: safeParse(rec.donation, {}),
    nationality: rec.nationality ?? undefined,
    languagesSpoken: safeParse(rec.languagesSpoken, undefined),
    isVerified: Boolean(rec.isVerified),
    socialLinks: safeParse(rec.socialLinks, undefined),
    metrics: liveStats ? { ...storedMetrics, ...liveStats } : storedMetrics,
    businessInfo: safeParse(rec.businessInfo, undefined),
    specialties: safeParse(rec.specialties, undefined),
    status: rec.status ?? "ACTIVE",
    createdAt: rec.createdAt?.toISOString?.() ?? rec.createdAt,
    updatedAt: rec.updatedAt?.toISOString?.() ?? rec.updatedAt,
  };
}

const FONTS_RATING_SELECT = { fonts: { select: { userRating: true, userRatingsCount: true } } };

export const getFontAuthors = unstable_cache(
  async (): Promise<FontAuthor[]> => {
    const records = await withSafeDbQuery(() =>
      prisma.fontAuthor.findMany({ orderBy: { name: "asc" }, include: FONTS_RATING_SELECT })
    );
    return records.map(mapFontAuthor);
  },
  ["font-authors-all"],
  { revalidate: 600, tags: [CACHE_TAGS.fontAuthors, CACHE_TAGS.ingredients] }
);

export async function getFontAuthorBySlug(slug: string): Promise<FontAuthor | null> {
  const record = await withSafeDbQuery(() =>
    prisma.fontAuthor.findUnique({ where: { slug }, include: FONTS_RATING_SELECT })
  );
  return record ? mapFontAuthor(record) : null;
}

export async function getFontAuthorById(id: string): Promise<FontAuthor | null> {
  const record = await withSafeDbQuery(() =>
    prisma.fontAuthor.findUnique({ where: { id }, include: FONTS_RATING_SELECT })
  );
  return record ? mapFontAuthor(record) : null;
}

// Get-or-create per gli autori placeholder (uno per fonte d'import). Lazy
// invece che seedati a boot: questo progetto non ha un entrypoint di avvio
// affidabile per un seed proattivo (D1/edge), quindi ogni chiamante che ne ha
// bisogno (import routes, AI candidate check) le crea al primo utilizzo.
export async function getOrCreatePlaceholderFontAuthorId(key: PlaceholderFontAuthorKey): Promise<string> {
  const def = PLACEHOLDER_FONT_AUTHORS[key];

  const existing = await prisma.fontAuthor.findUnique({ where: { slug: def.slug }, select: { id: true } });
  if (existing) return existing.id;

  try {
    const created = await prisma.fontAuthor.create({
      data: {
        id: crypto.randomUUID(),
        slug: def.slug,
        name: def.name,
        type: "UNKNOWN",
        email: def.email,
        donation: "{}",
        metrics: JSON.stringify(DEFAULT_METRICS),
        status: "ACTIVE",
        isVerified: false,
        createdAt: new Date(),
      },
    });
    return created.id;
  } catch {
    // Race: un'altra richiesta l'ha creato tra il findUnique e la create qui sopra.
    const retry = await prisma.fontAuthor.findUnique({ where: { slug: def.slug }, select: { id: true } });
    if (retry) return retry.id;
    throw new Error(`Failed to get or create placeholder font author "${def.slug}".`);
  }
}

export async function getAllPlaceholderFontAuthorIds(): Promise<string[]> {
  const keys = Object.keys(PLACEHOLDER_FONT_AUTHORS) as PlaceholderFontAuthorKey[];
  return Promise.all(keys.map((key) => getOrCreatePlaceholderFontAuthorId(key)));
}

const DEFAULT_FONT_AUTHOR_METRICS_JSON = JSON.stringify(DEFAULT_METRICS);

// Trova un FontAuthor reale gia' esistente per nome, o lo crea al volo.
// Condiviso tra lib/actions/font.ts (quando Gemini identifica l'autore reale
// dietro un font ancora sul placeholder d'import) e le route di bulk import
// da provider (quando il designer e' gia' noto dal payload — es. Fontshare
// lo fornisce sempre — cosi' il font non finisce con un authorId nullo
// nonostante il nome reale sia gia' disponibile). Nessun email reale
// disponibile: ne generiamo una sintetica, come per i placeholder stessi.
export async function findOrCreateFontAuthorByName(name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.toLowerCase() === "unknown") return null;

  const existing = await prisma.fontAuthor.findFirst({ where: { name: trimmed } });
  if (existing) return existing.id;

  const baseSlug = trimmed
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  let slug = baseSlug || crypto.randomUUID().slice(0, 8);
  let i = 2;
  while (await prisma.fontAuthor.findFirst({ where: { slug } })) {
    slug = `${baseSlug}-${i++}`;
  }

  const author = await prisma.fontAuthor.create({
    data: {
      id: crypto.randomUUID(),
      slug,
      name: trimmed,
      type: "UNKNOWN",
      email: `${slug}@ai-discovered.typamine.internal`,
      donation: "{}",
      metrics: DEFAULT_FONT_AUTHOR_METRICS_JSON,
      status: "ACTIVE",
      isVerified: false,
      createdAt: new Date(),
    },
  });

  revalidatePath("/admin/font-authors");
  revalidateTag(CACHE_TAGS.fontAuthors, "max");

  return author.id;
}
