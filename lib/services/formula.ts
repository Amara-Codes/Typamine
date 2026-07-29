import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { Formula, Ingredient, FontVariant, Tag } from "@/types";
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
    importedFrom: rec.importedFrom ?? undefined,
    licenseType: rec.licenseType ?? undefined,
    isVariable: rec.isVariable,
    userRating: rec.userRating ?? 0,
    userRatingsCount: rec.userRatingsCount ?? 0,
    authorId: rec.authorId ?? undefined,
    author: rec.author
      ? { id: rec.author.id, name: rec.author.name, slug: rec.author.slug, avatarUrl: rec.author.avatarUrl ?? undefined, isVerified: rec.author.isVerified }
      : undefined,
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

function toFormula(record: any): Formula {
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? undefined,
    slug: record.slug,
    fontCategory: record.fontCategory,
    createdAt: record.createdAt?.toISOString(),
    updatedAt: record.updatedAt?.toISOString(),
    fonts: (record.fonts || []).map(mapIngredient),
    tags: (record.tags || []).map((t: any): Tag => ({
      id: t.id,
      name: t.name,
      description: t.description ?? undefined,
    })),
  };
}

export interface FormulasPageResult {
  items: Formula[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export type FormulaSort = "recent" | "name_asc" | "name_desc";

export const getRecentFormulas = unstable_cache(
  async (limit = 4): Promise<Formula[]> => {
    const records = await withSafeDbQuery(() =>
      prisma.formula.findMany({
        include: { fonts: { include: { variants: true, author: true } }, tags: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
    );
    return records.map(toFormula);
  },
  ["formulas-recent"],
  { revalidate: 300, tags: [CACHE_TAGS.formulas] }
);

// Le collezioni curate a mano in admin sono in numero contenuto (a differenza
// di fonts/pairings), quindi qui non serve paginazione: si mostrano sempre
// tutte insieme alle formule programmatiche in /formulas.
export const getAllFormulas = unstable_cache(
  async (): Promise<Formula[]> => {
    const records = await withSafeDbQuery(() =>
      prisma.formula.findMany({
        include: { fonts: { include: { variants: true, author: true } }, tags: true },
        orderBy: { createdAt: "desc" },
      })
    );
    return records.map(toFormula);
  },
  ["formulas-all"],
  { revalidate: 60, tags: [CACHE_TAGS.formulas] }
);

export interface GetFormulasPageOptions {
  page?: number;
  perPage?: number;
  category?: string;
  /** Formule che hanno ALMENO UNO di questi tag (unione, non intersezione). */
  tagIds?: string[];
  search?: string;
  sort?: FormulaSort;
}

export const getFormulasPage = unstable_cache(
  async ({
    page = 1,
    perPage = 12,
    category,
    tagIds,
    search,
    sort = "recent",
  }: GetFormulasPageOptions = {}): Promise<FormulasPageResult> => {
  const and: any[] = [];
  if (category && category !== "ALL") and.push({ fontCategory: category });
  if (tagIds && tagIds.length > 0) and.push({ tags: { some: { id: { in: tagIds } } } });
  if (search) {
    and.push({
      OR: [
        { name: { contains: search } },
        { description: { contains: search } },
      ],
    });
  }
  const where: any = and.length > 0 ? { AND: and } : {};

  const orderBy =
    sort === "name_asc" ? { name: "asc" as const }
    : sort === "name_desc" ? { name: "desc" as const }
    : { createdAt: "desc" as const };

  const [records, total] = await withSafeDbQuery(() =>
    Promise.all([
      prisma.formula.findMany({
        where,
        include: { fonts: { include: { variants: true, author: true } }, tags: true },
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.formula.count({ where }),
    ])
  );

  return {
    items: records.map(toFormula),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
  },
  ["formulas-page"],
  { revalidate: 60, tags: [CACHE_TAGS.formulas] }
);

export const getFormulaBySlug = unstable_cache(
  async (slug: string): Promise<Formula | null> => {
    const record = await withSafeDbQuery(() =>
      prisma.formula.findUnique({
        where: { slug },
        include: { fonts: { include: { variants: true, author: true } }, tags: true },
      })
    );
    return record ? toFormula(record) : null;
  },
  ["formula-by-slug"],
  { revalidate: 300, tags: [CACHE_TAGS.formulas] }
);
