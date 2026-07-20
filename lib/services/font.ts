import prisma from "@/lib/prisma";
import { Prisma } from "../../prisma/generated-client";
import { Ingredient, FontVariant, Tag } from "@/types";

type IngredientRecord = Prisma.IngredientGetPayload<{ include: { variants: true; tags: true } }>;

// Righe create prima dell'introduzione della colonna `createdAt` possono avere
// un NULL letterale nonostante lo schema la dichiari NOT NULL (il DEFAULT a
// livello SQL non è stato applicato retroattivamente su ogni binding — D1
// locale, D1 remoto, sqlite locale — quando la colonna è stata aggiunta).
// Se una query fallisce per questo, la ripariamo una volta sola sulla stessa
// connessione realmente in uso e ritentiamo, invece di dover indovinare quale
// database fisico il processo in esecuzione sta usando.
import { withSafeDbQuery } from "./dbMigration";

export async function withCreatedAtBackfill<T>(run: () => Promise<T>): Promise<T> {
  return withSafeDbQuery(run);
}

// Normalizza il record Prisma (campi nullable, style non tipizzato) nella shape
// pubblica `Ingredient` usata dai componenti — i servizi pubblici non devono
// esporre direttamente le convenzioni del DB (null vs undefined, string vs union).
function toIngredient(record: IngredientRecord): Ingredient {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    category: record.category,
    creator: record.creator ?? undefined,
    rating: record.rating,
    symbol: record.symbol ?? undefined,
    formula: record.formula ?? undefined,
    isVariable: record.isVariable,
    tags: (record.tags || []).map((t): Tag => ({
      id: t.id,
      name: t.name,
      description: t.description ?? undefined,
    })),
    variants: record.variants.map((v): FontVariant => ({
      id: v.id,
      fontFamilyName: v.fontFamilyName,
      weight: v.weight,
      style: v.style as FontVariant["style"],
      woff2Url: v.woff2Url,
      label: v.label,
    })),
  };
}

export async function getRecentIngredients(limit = 4): Promise<Ingredient[]> {
  const records = await withCreatedAtBackfill(() =>
    prisma.ingredient.findMany({
      include: { variants: true, tags: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    })
  );
  return records.map(toIngredient);
}

export interface IngredientsPageResult {
  items: Ingredient[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export type IngredientSort = "recent" | "name_asc" | "name_desc" | "rating_desc";

export async function getIngredientsPage({
  page = 1,
  perPage = 12,
  category,
  rating,
  tagIds,
  search,
  sort = "recent",
}: {
  page?: number;
  perPage?: number;
  category?: string;
  /** Soglia minima (es. "8.0") — confronto lessicografico su stringhe "X.Y", coerente con i dati esistenti. */
  rating?: string;
  /** Font che hanno ALMENO UNO di questi tag (unione, non intersezione). */
  tagIds?: string[];
  search?: string;
  sort?: IngredientSort;
}): Promise<IngredientsPageResult> {
  const where: Prisma.IngredientWhereInput = {};
  if (category && category !== "ALL") where.category = category;
  if (rating && rating !== "ALL") where.rating = { gte: rating };
  if (tagIds && tagIds.length > 0) where.tags = { some: { id: { in: tagIds } } };
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { formula: { contains: search } },
      { creator: { contains: search } },
    ];
  }

  const orderBy: Prisma.IngredientOrderByWithRelationInput =
    sort === "name_asc" ? { name: "asc" }
    : sort === "name_desc" ? { name: "desc" }
    : sort === "rating_desc" ? { rating: "desc" }
    : { createdAt: "desc" };

  const [records, total] = await withCreatedAtBackfill(() =>
    Promise.all([
      prisma.ingredient.findMany({
        where,
        include: { variants: true, tags: true },
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.ingredient.count({ where }),
    ])
  );

  return {
    items: records.map(toIngredient),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getIngredientBySlug(slug: string): Promise<Ingredient | null> {
  const record = await withCreatedAtBackfill(() =>
    prisma.ingredient.findUnique({
      where: { slug },
      include: { variants: true, tags: true },
    })
  );
  return record ? toIngredient(record) : null;
}
