import prisma from "@/lib/prisma";
import { Formula, Ingredient, FontVariant, Tag } from "@/types";
import { withSafeDbQuery } from "./dbMigration";

// Formule "programmatiche": non sono righe nel DB, sono calcolate al volo da
// regole applicate ai dati reali di Ingredient/Tag/Prescription. Crescono da
// sole man mano che aumentano tag, categorie e creator — non serve crearle
// a mano in admin. Ogni regola produce zero o più "semi", ciascuno diventa
// una Formula con uno slug stabile e deterministico (usato per risolvere
// /formulas/[slug] quando non esiste come riga reale).

const PER_FORMULA_LIMIT = 6;
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

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
    createdAt: rec.createdAt?.toISOString?.() ?? rec.createdAt,
    updatedAt: rec.updatedAt?.toISOString?.() ?? rec.updatedAt,
    tags: (rec.tags || []).map((t: any): Tag => ({
      id: t.id,
      name: t.name,
      description: t.description ?? undefined,
    })),
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

interface VirtualFormulaSeed {
  slug: string;
  name: string;
  description: string;
  fontCategory: string;
  fonts: Ingredient[];
  tags?: Tag[];
}

function byRatingDesc(a: { rating: string }, b: { rating: string }) {
  return parseFloat(b.rating) - parseFloat(a.rating);
}

function byCreatedAtDesc(a: { createdAt?: string }, b: { createdAt?: string }) {
  return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
}

function seedToFormula(seed: VirtualFormulaSeed): Formula {
  const now = new Date().toISOString();
  return {
    id: `virtual-${seed.slug}`,
    slug: seed.slug,
    name: seed.name,
    description: seed.description,
    fontCategory: seed.fontCategory,
    createdAt: now,
    updatedAt: now,
    fonts: seed.fonts,
    tags: seed.tags || [],
  };
}

/**
 * Genera tutte le formule programmatiche attualmente possibili con i dati
 * reali. Fa un'unica fetch di ingredients/tags/prescriptions e deriva tutto
 * in memoria, invece di N query per tag/categoria/creator.
 */
export async function getVirtualFormulas(): Promise<Formula[]> {
  const [rawIngredients, tags, prescriptions] = await withSafeDbQuery(() =>
    Promise.all([
      prisma.ingredient.findMany({ include: { tags: true, variants: true } }),
      prisma.tag.findMany(),
      prisma.prescription.findMany({
        where: { published: true },
        select: { primaryFontId: true, secondaryFontId: true },
      }),
    ])
  );

  const ingredients = rawIngredients.map(mapIngredient);
  if (ingredients.length === 0) return [];

  const seeds: VirtualFormulaSeed[] = [];
  const now = new Date();
  const monthLabel = MONTH_NAMES[now.getMonth()];
  const monthSlug = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const isThisMonth = (iso?: string) => {
    if (!iso) return false;
    const d = new Date(iso);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  // 1. "Best {Tag} Fonts" — una per ogni tag esistente con almeno un font.
  // La collection eredita il tag stesso (es. "horror") e la categoria
  // prevalente tra i font che matchano, invece di un generico "Mixed",
  // così i filtri per tag/categoria su /formulas restano coerenti.
  for (const tag of tags) {
    const matches = ingredients
      .filter((i) => i.tags?.some((t) => t.id === tag.id))
      .sort(byRatingDesc);
    if (matches.length === 0) continue;

    const categoryCounts = new Map<string, number>();
    for (const i of matches) {
      categoryCounts.set(i.category, (categoryCounts.get(i.category) || 0) + 1);
    }
    const [dominantCategory, dominantCount] = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const fontCategory = dominantCount === matches.length ? dominantCategory : "Mixed";

    seeds.push({
      slug: `best-tag-${slugify(tag.name)}`,
      name: `Best ${tag.name} Fonts`,
      description: `Our highest-rated fonts tagged "${tag.name}" — hand-picked for anyone chasing that exact vibe.`,
      fontCategory,
      fonts: matches.slice(0, PER_FORMULA_LIMIT),
      tags: [{ id: tag.id, name: tag.name, description: tag.description ?? undefined }],
    });
  }

  // 2. "Best {Category} Fonts" / 3. "New {Category} Fonts of {Month}" — una coppia per ogni categoria esistente.
  const categories = Array.from(new Set(ingredients.map((i) => i.category))).filter(Boolean);
  for (const category of categories) {
    const inCategory = ingredients.filter((i) => i.category === category);

    const best = [...inCategory].sort(byRatingDesc);
    seeds.push({
      slug: `best-category-${slugify(category)}`,
      name: `Best ${category} Fonts`,
      description: `The top-rated ${category} typefaces in our entire archive, ranked by the Typamine score.`,
      fontCategory: category,
      fonts: best.slice(0, PER_FORMULA_LIMIT),
    });

    const newThisMonth = inCategory.filter((i) => isThisMonth(i.createdAt)).sort(byCreatedAtDesc);
    if (newThisMonth.length > 0) {
      seeds.push({
        slug: `new-${slugify(category)}-${monthSlug}`,
        name: `New ${category} Fonts of ${monthLabel} ${now.getFullYear()}`,
        description: `Freshly synthesized ${category} typefaces added to the archive this ${monthLabel} — get them while they're hot.`,
        fontCategory: category,
        fonts: newThisMonth.slice(0, PER_FORMULA_LIMIT),
      });
    }
  }

  // 4. "{Creator} Foundry Spotlight" — una per ogni creator con almeno 2 font.
  const byCreator = new Map<string, Ingredient[]>();
  for (const i of ingredients) {
    if (!i.creator) continue;
    const list = byCreator.get(i.creator) || [];
    list.push(i);
    byCreator.set(i.creator, list);
  }
  for (const [creator, list] of byCreator) {
    if (list.length < 2) continue;
    seeds.push({
      slug: `foundry-${slugify(creator)}`,
      name: `${creator} Foundry Spotlight`,
      description: `A closer look at the typefaces crafted by ${creator}, all in one place.`,
      fontCategory: "Mixed",
      fonts: [...list].sort(byRatingDesc).slice(0, PER_FORMULA_LIMIT),
    });
  }

  // 5. All-Time Top Typamine Ranked
  seeds.push({
    slug: "top-ranked",
    name: "All-Time Top Typamine Ranked",
    description: "The highest-scoring fonts across our entire catalogue, exactly as our internal ranking sees them.",
    fontCategory: "Mixed",
    fonts: [...ingredients].sort(byRatingDesc).slice(0, PER_FORMULA_LIMIT + 2),
  });

  // 6. Latest Arrivals
  seeds.push({
    slug: "latest-arrivals",
    name: "Latest Arrivals",
    description: "The newest additions to the archive — freshly synthesized and ready to test drive.",
    fontCategory: "Mixed",
    fonts: [...ingredients].sort(byCreatedAtDesc).slice(0, PER_FORMULA_LIMIT),
  });

  // 7. Variable Font Showcase
  const variableFonts = ingredients.filter((i) => i.isVariable).sort(byRatingDesc);
  if (variableFonts.length > 0) {
    seeds.push({
      slug: "variable-fonts",
      name: "Variable Font Showcase",
      description: "Single-file fonts that flex across weights and styles in one compact package.",
      fontCategory: "Mixed",
      fonts: variableFonts.slice(0, PER_FORMULA_LIMIT),
    });
  }

  // 8. Timeless Static Classics
  const staticClassics = ingredients
    .filter((i) => !i.isVariable && parseFloat(i.rating) >= 9.0)
    .sort(byRatingDesc);
  if (staticClassics.length > 0) {
    seeds.push({
      slug: "static-classics",
      name: "Timeless Static Classics",
      description: "Reliable, single-weight typefaces rated 9+ that never go out of style.",
      fontCategory: "Mixed",
      fonts: staticClassics.slice(0, PER_FORMULA_LIMIT),
    });
  }

  // 9. Most Prescribed Fonts — in base a quante prescriptions pubblicate le usano.
  const usageCount = new Map<string, number>();
  for (const p of prescriptions) {
    usageCount.set(p.primaryFontId, (usageCount.get(p.primaryFontId) || 0) + 1);
    usageCount.set(p.secondaryFontId, (usageCount.get(p.secondaryFontId) || 0) + 1);
  }
  const mostPrescribed = ingredients
    .filter((i) => (usageCount.get(i.id) || 0) > 0)
    .sort((a, b) => (usageCount.get(b.id) || 0) - (usageCount.get(a.id) || 0));
  if (mostPrescribed.length > 0) {
    seeds.push({
      slug: "most-prescribed",
      name: "Most Prescribed Fonts",
      description: "The fonts our community pairs together most often in published prescriptions — proven combinations.",
      fontCategory: "Mixed",
      fonts: mostPrescribed.slice(0, PER_FORMULA_LIMIT),
    });
  }

  return seeds.map(seedToFormula);
}

export async function getVirtualFormulaBySlug(slug: string): Promise<Formula | null> {
  const all = await getVirtualFormulas();
  return all.find((f) => f.slug === slug) || null;
}
