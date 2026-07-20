import prisma from "@/lib/prisma";
import { Prisma } from "../../prisma/generated-client";

let isMigrated = false;

async function addCol(table: string, col: string, type: string) {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
  } catch (err) {
    // Ignora errore di colonna già esistente
  }
}

export async function ensureD1SchemaUpdated(force = false) {
  if (isMigrated && !force) return;

  try {
    // 1. Create Tables if missing
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS Tag (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch {}

    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS Prescription (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          description TEXT,
          imageUrl TEXT,
          published BOOLEAN DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          primaryFontId TEXT NOT NULL,
          secondaryFontId TEXT NOT NULL
        )
      `);
    } catch {}

    // 2. Add columns safely to Tag
    await addCol("Tag", "description", "TEXT");
    await addCol("Tag", "createdAt", "DATETIME");
    await addCol("Tag", "updatedAt", "DATETIME");

    // 3. Add columns safely to Ingredient
    await addCol("Ingredient", "updatedAt", "DATETIME");
    try {
      await prisma.$executeRawUnsafe(`UPDATE Ingredient SET createdAt = CURRENT_TIMESTAMP WHERE createdAt IS NULL`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`UPDATE Ingredient SET updatedAt = CURRENT_TIMESTAMP WHERE updatedAt IS NULL`);
    } catch {}

    // 4. Add columns safely to Prescription
    await addCol("Prescription", "slug", "TEXT");
    await addCol("Prescription", "published", "BOOLEAN DEFAULT 0");
    await addCol("Prescription", "imageUrl", "TEXT");
    await addCol("Prescription", "primaryFontId", "TEXT");
    await addCol("Prescription", "secondaryFontId", "TEXT");
    await addCol("Prescription", "createdAt", "DATETIME");
    await addCol("Prescription", "updatedAt", "DATETIME");

    // 5. Join table for the Ingredient <-> Tag many-to-many relation
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS _IngredientTags (
          A TEXT NOT NULL,
          B TEXT NOT NULL
        )
      `);
    } catch {}

    // 6. Add columns safely to Formula (rinominato da href/code a slug/fontCategory/updatedAt)
    await addCol("Formula", "slug", "TEXT");
    await addCol("Formula", "fontCategory", "TEXT");
    await addCol("Formula", "updatedAt", "DATETIME");
    try {
      // Nessuna logica di slugify disponibile in SQL puro: usiamo l'id come
      // fallback univoco per le righe legacy, modificabile poi dall'admin.
      await prisma.$executeRawUnsafe(`UPDATE Formula SET slug = id WHERE slug IS NULL`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`UPDATE Formula SET fontCategory = 'Uncategorized' WHERE fontCategory IS NULL`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`UPDATE Formula SET createdAt = CURRENT_TIMESTAMP WHERE createdAt IS NULL`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`UPDATE Formula SET updatedAt = CURRENT_TIMESTAMP WHERE updatedAt IS NULL`);
    } catch {}

    // 7. Join table for the Formula <-> Tag many-to-many relation
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS _FormulaTags (
          A TEXT NOT NULL,
          B TEXT NOT NULL
        )
      `);
    } catch {}

    isMigrated = true;
  } catch (err) {
    console.error("[DbMigration] Error migrating D1 schema:", err);
  }
}

export async function withSafeDbQuery<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (err) {
    const isSchemaError =
      err instanceof Prisma.PrismaClientKnownRequestError &&
      (err.code === "P2021" || err.code === "P2022" || err.code === "P2032");

    if (!isSchemaError) throw err;

    await ensureD1SchemaUpdated(true);
    return await run();
  }
}
