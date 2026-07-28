import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { Prescription, Ingredient, FontVariant } from "@/types";
import { withSafeDbQuery } from "./dbMigration";
import { CACHE_TAGS } from "@/lib/cacheTags";

function mapIngredient(rec: any): Ingredient {
  return {
    id: rec.id,
    name: rec.name,
    slug: rec.slug,
    category: rec.category,
    creator: rec.creator ?? undefined,
    rating: rec.rating,
    symbol: rec.symbol ?? undefined,
    formula: rec.formula ?? undefined,
    isVariable: rec.isVariable,
    createdAt: rec.createdAt?.toISOString(),
    updatedAt: rec.updatedAt?.toISOString(),
    variants: (rec.variants || []).map((v: any): FontVariant => ({
      id: v.id,
      fontFamilyName: v.fontFamilyName,
      weight: v.weight,
      style: v.style as FontVariant["style"],
      woff2Url: v.woff2Url,
      label: v.label,
    })),
  };
}

function toPrescription(record: any): Prescription {
  const primaryFont = record.primaryFont ? mapIngredient(record.primaryFont) : undefined;
  const secondaryFont = record.secondaryFont ? mapIngredient(record.secondaryFont) : undefined;
  const fonts = [primaryFont, secondaryFont].filter(Boolean) as Ingredient[];

  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    description: record.description ?? undefined,
    imageUrl: record.imageUrl ?? undefined,
    insight: record.insight ?? undefined,
    published: record.published,
    createdAt: record.createdAt?.toISOString(),
    updatedAt: record.updatedAt?.toISOString(),
    primaryFontId: record.primaryFontId,
    primaryFont,
    secondaryFontId: record.secondaryFontId,
    secondaryFont,
    tags: (record.tags || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      description: t.description ?? undefined,
    })),
    // Backward compatibility
    href: `/prescriptions/${record.slug}`,
    imgUrl: record.imageUrl ?? undefined,
    fonts,
  };
}

export interface PairingsPageResult {
  items: Prescription[];
  total: number;
  page: number;
  perPage: number;
}

export const getRecentPairings = unstable_cache(
  async (limit = 4): Promise<Prescription[]> => {
    const records = await withSafeDbQuery(() =>
      prisma.prescription.findMany({
        where: { published: true },
        include: {
          primaryFont: { include: { variants: true } },
          secondaryFont: { include: { variants: true } },
          tags: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
    );
    return records.map(toPrescription);
  },
  ["pairings-recent"],
  { revalidate: 300, tags: [CACHE_TAGS.pairings] }
);

export type PairingSort = "recent" | "name_asc" | "name_desc";

export interface GetPairingsPageOptions {
  page?: number;
  perPage?: number;
  publishedOnly?: boolean;
  /** Pairing che hanno ALMENO UNO di questi tag (unione, non intersezione). */
  tagIds?: string[];
  search?: string;
  /** Pairing che usano questo font come primario o secondario. */
  fontName?: string;
  sort?: PairingSort;
}

export const getPairingsPage = unstable_cache(
  async (options?: GetPairingsPageOptions): Promise<PairingsPageResult> => {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 12;

  // Ogni filtro qui sotto è un blocco OR indipendente (es. search cerca su
  // più campi, fontName su primario/secondario) — vanno combinati in AND tra
  // loro, non assegnati tutti a where.OR (altrimenti l'ultimo sovrascrive
  // silenziosamente i precedenti).
  const and: any[] = [];
  if (options?.publishedOnly) and.push({ published: true });
  if (options?.tagIds && options.tagIds.length > 0) {
    and.push({ tags: { some: { id: { in: options.tagIds } } } });
  }
  if (options?.search) {
    and.push({
      OR: [
        { name: { contains: options.search } },
        { description: { contains: options.search } },
        { primaryFont: { name: { contains: options.search } } },
        { secondaryFont: { name: { contains: options.search } } },
      ],
    });
  }
  if (options?.fontName) {
    and.push({
      OR: [
        { primaryFont: { name: options.fontName } },
        { secondaryFont: { name: options.fontName } },
      ],
    });
  }
  const where: any = and.length > 0 ? { AND: and } : {};

  const orderBy =
    options?.sort === "name_asc" ? { name: "asc" as const }
    : options?.sort === "name_desc" ? { name: "desc" as const }
    : { createdAt: "desc" as const };

  const total = await withSafeDbQuery(() => prisma.prescription.count({ where }));
  const records = await withSafeDbQuery(() =>
    prisma.prescription.findMany({
      where,
      include: {
        primaryFont: { include: { variants: true } },
        secondaryFont: { include: { variants: true } },
        tags: true,
      },
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    })
  );

  return {
    items: records.map(toPrescription),
    total,
    page,
    perPage,
  };
  },
  ["pairings-page"],
  { revalidate: 60, tags: [CACHE_TAGS.pairings] }
);

// Usato dalla pagina di dettaglio font pubblica per decidere se mostrare il
// rimando alle prescriptions che usano quel font (come primario o secondario).
export const getPairingsCountForFont = unstable_cache(
  async (fontId: string): Promise<number> => {
    return withSafeDbQuery(() =>
      prisma.prescription.count({
        where: {
          published: true,
          OR: [{ primaryFontId: fontId }, { secondaryFontId: fontId }],
        },
      })
    );
  },
  ["pairings-count-for-font"],
  { revalidate: 300, tags: [CACHE_TAGS.pairings] }
);

export const getPairings = unstable_cache(
  async (options?: { publishedOnly?: boolean }): Promise<Prescription[]> => {
    const where = options?.publishedOnly ? { published: true } : {};

    const records = await withSafeDbQuery(() =>
      prisma.prescription.findMany({
        where,
        include: {
          primaryFont: { include: { variants: true } },
          secondaryFont: { include: { variants: true } },
          tags: true,
        },
        orderBy: { createdAt: "desc" },
      })
    );

    return records.map(toPrescription);
  },
  ["pairings-all"],
  { revalidate: 60, tags: [CACHE_TAGS.pairings] }
);

export async function getPairingById(id: string): Promise<Prescription | null> {
  const record = await withSafeDbQuery(() =>
    prisma.prescription.findUnique({
      where: { id },
      include: {
        primaryFont: { include: { variants: true } },
        secondaryFont: { include: { variants: true } },
        tags: true,
      },
    })
  );

  return record ? toPrescription(record) : null;
}

export const getPairingBySlug = unstable_cache(
  async (slug: string): Promise<Prescription | null> => {
    const record = await withSafeDbQuery(() =>
      prisma.prescription.findUnique({
        where: { slug },
        include: {
          primaryFont: { include: { variants: true } },
          secondaryFont: { include: { variants: true } },
          tags: true,
        },
      })
    );

    return record ? toPrescription(record) : null;
  },
  ["pairing-by-slug"],
  { revalidate: 300, tags: [CACHE_TAGS.pairings] }
);
