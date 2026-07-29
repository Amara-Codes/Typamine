import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { FontAuthor } from "@/types";
import { withSafeDbQuery } from "./dbMigration";
import { CACHE_TAGS } from "@/lib/cacheTags";

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
