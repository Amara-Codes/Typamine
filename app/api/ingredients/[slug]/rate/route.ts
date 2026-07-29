import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withSafeDbQuery } from "@/lib/services/dbMigration";
import { revalidateTag, revalidatePath } from "next/cache";
import { CACHE_TAGS } from "@/lib/cacheTags";

// Nessun sistema di auth per gli utenti pubblici in questo progetto: l'unico
// anti-spam disponibile senza costruire account/sessioni è un cookie
// per-font, letto/scritto qui — non a prova di utente che cancella i cookie,
// ma sufficiente a impedire i doppi voti accidentali del caso comune.
function votedCookieName(ingredientId: string) {
  return `tm_rated_${ingredientId}`;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let value: number;
  try {
    const body = await request.json();
    value = Number(body?.value);
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return NextResponse.json({ error: "value must be an integer between 1 and 5." }, { status: 400 });
  }

  const ingredient = await withSafeDbQuery(() =>
    prisma.ingredient.findUnique({
      where: { slug },
      select: { id: true, userRating: true, userRatingsCount: true },
    })
  );

  if (!ingredient) {
    return NextResponse.json({ error: "Font not found." }, { status: 404 });
  }

  const cookieName = votedCookieName(ingredient.id);
  if (request.cookies.get(cookieName)) {
    return NextResponse.json({ error: "You already rated this font." }, { status: 409 });
  }

  const prevCount = ingredient.userRatingsCount ?? 0;
  const prevAverage = ingredient.userRating ?? 0;
  const newCount = prevCount + 1;
  const newAverage = (prevAverage * prevCount + value) / newCount;

  await prisma.ingredient.update({
    where: { id: ingredient.id },
    data: { userRating: newAverage, userRatingsCount: newCount },
  });

  revalidateTag(CACHE_TAGS.ingredients, "max");
  revalidatePath(`/ingredients/${slug}`);

  const response = NextResponse.json({ userRating: newAverage, userRatingsCount: newCount });
  response.cookies.set(cookieName, "1", {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
  return response;
}
