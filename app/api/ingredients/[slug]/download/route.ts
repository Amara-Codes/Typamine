import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withSafeDbQuery } from "@/lib/services/dbMigration";
import { incrementFontAuthorDownloads } from "@/lib/services/fontAuthor";

// Chiamata fire-and-forget dal client dopo un download WOFF2 riuscito (vedi
// IngredientDetailClient.tsx) — nessun blocco/anti-spam qui a differenza di
// /rate: un download non ha lo stesso incentivo a essere "gonfiato" ripetuto
// che avrebbe un voto, e non c'e' un valore utente da proteggere da doppio invio.
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const ingredient = await withSafeDbQuery(() =>
    prisma.ingredient.findUnique({
      where: { slug },
      select: { id: true, authorId: true },
    })
  );

  if (!ingredient) {
    return NextResponse.json({ error: "Font not found." }, { status: 404 });
  }

  if (ingredient.authorId) {
    try {
      await incrementFontAuthorDownloads(ingredient.authorId);
    } catch (err) {
      console.error("Failed to increment FontAuthor download counter:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
