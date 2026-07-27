import { getRecentIngredients } from "@/lib/services/font";
import { getRecentPairings } from "@/lib/services/pairing";
import { getAllFormulas } from "@/lib/services/formula";
import { getVirtualFormulas } from "@/lib/services/virtualFormula";
import RAW_PAIRINGS from "@/lib/sample-data/pairings.json";
import ALL_INGREDIENTS from "@/lib/sample-data/fonts.json";
import { Prescription, Ingredient } from "@/types";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

const FALLBACK_PAIRINGS: Prescription[] = RAW_PAIRINGS.slice(0, 4).map((raw) => ({
  ...raw,
  published: true,
  primaryFontId: raw.fonts[0] || "",
  secondaryFontId: raw.fonts[1] || "",
  tags: raw.tags.map((t, idx) => ({ id: `tag-${idx}`, name: t })),
  fonts: raw.fonts.map((slug) => ALL_INGREDIENTS.find((f) => f.slug === slug) as Ingredient).filter(Boolean),
}));

function pickRandom<T>(items: T[], count: number): T[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export default async function Home() {
  const [recentIngredients, dbPairings, realFormulas, virtualFormulas] = await Promise.all([
    getRecentIngredients(8),
    getRecentPairings(4),
    getAllFormulas(),
    getVirtualFormulas(),
  ]);

  const recentPairings = dbPairings.length > 0 ? dbPairings : FALLBACK_PAIRINGS;

  const formulaPool = [
    ...realFormulas.map((formula) => ({ formula, isCurated: true })),
    ...virtualFormulas.map((formula) => ({ formula, isCurated: false })),
  ];
  const featuredFormulas = pickRandom(formulaPool, 8);

  return (
    <HomeClient
      recentIngredients={recentIngredients}
      recentPairings={recentPairings}
      featuredFormulas={featuredFormulas}
    />
  );
}
