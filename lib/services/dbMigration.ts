import prisma from "@/lib/prisma";
import { Prisma } from "../../prisma/generated-client";
import crypto from "crypto";

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
    await addCol("Ingredient", "importedFrom", "TEXT");
    await addCol("Ingredient", "licenseType", "TEXT");
    await addCol("Ingredient", "authorId", "TEXT");
    await addCol("Ingredient", "userRating", "REAL DEFAULT 0");
    await addCol("Ingredient", "userRatingsCount", "INTEGER DEFAULT 0");
    try {
      await prisma.$executeRawUnsafe(`UPDATE Ingredient SET userRating = 0 WHERE userRating IS NULL`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`UPDATE Ingredient SET userRatingsCount = 0 WHERE userRatingsCount IS NULL`);
    } catch {}
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
    await addCol("Prescription", "insight", "TEXT");

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
    // Le colonne legacy href/code erano NOT NULL: su ambienti (D1) dove la
    // tabella esisteva da prima del rename, sono ancora lì e bloccano ogni
    // create() che non le popola più. Le rimuoviamo (no-op se già assenti,
    // es. su dev.db locale ricreato da `prisma db push`). href aveva anche un
    // indice UNIQUE residuo (Formula_href_key) che fa fallire silenziosamente
    // la DROP COLUMN se non viene tolto per primo.
    try {
      await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS Formula_href_key`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE Formula DROP COLUMN href`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS Formula_code_key`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE Formula DROP COLUMN code`);
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

    // 8. Post table (generalizzato da ArchivePost, serve sia /archive che
    // /blog via la colonna postType) + le sue join table many-to-many.
    // Su ambienti dove la tabella esisteva ancora col vecchio nome, la
    // rinominiamo sul posto (rename atomico, nessuna copia/perdita dati) —
    // no-op silenzioso se ArchivePost non esiste più (già migrato) o non è
    // mai esistita (D1 nuovo, coperto dalla CREATE TABLE IF NOT EXISTS sotto).
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE ArchivePost RENAME TO Post`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE _ArchivePostTags RENAME TO _PostTags`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE _ArchivePostFonts RENAME TO _PostFonts`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS Post (
          id TEXT PRIMARY KEY NOT NULL,
          postType TEXT DEFAULT 'ARCHIVE',
          title TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          caption TEXT,
          description TEXT,
          thumbnailUrl TEXT,
          imageUrl TEXT,
          imageAlt TEXT,
          insight TEXT,
          published BOOLEAN DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          authorId TEXT NOT NULL
        )
      `);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS _PostTags (
          A TEXT NOT NULL,
          B TEXT NOT NULL
        )
      `);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS _PostFonts (
          A TEXT NOT NULL,
          B TEXT NOT NULL
        )
      `);
    } catch {}
    await addCol("Post", "postType", "TEXT");
    try {
      await prisma.$executeRawUnsafe(`UPDATE Post SET postType = 'ARCHIVE' WHERE postType IS NULL`);
    } catch {}

    // 9. SeoModule — entità condivisa (archive/blog/prescription), relazione
    // 1-a-1 opzionale via colonna seoId sul contenuto.
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS SeoModule (
          id TEXT PRIMARY KEY NOT NULL,
          metaTitle TEXT,
          metaDescription TEXT,
          keywords TEXT,
          ogTitle TEXT,
          ogDescription TEXT,
          ogImageUrl TEXT,
          ogImageAlt TEXT,
          twitterCard TEXT DEFAULT 'summary_large_image',
          twitterTitle TEXT,
          twitterDescription TEXT,
          twitterImageUrl TEXT,
          twitterImageAlt TEXT,
          canonicalUrl TEXT,
          noIndex BOOLEAN DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch {}
    await addCol("Post", "seoId", "TEXT");
    await addCol("Prescription", "seoId", "TEXT");

    // 10. FontAuthor — entità standalone per autori/fonderie di font.
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS FontAuthor (
          id TEXT PRIMARY KEY NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          type TEXT DEFAULT 'INDIVIDUAL',
          email TEXT NOT NULL,
          supportEmail TEXT,
          avatarUrl TEXT,
          bannerUrl TEXT,
          bio TEXT,
          website TEXT,
          donation TEXT,
          nationality TEXT,
          languagesSpoken TEXT,
          isVerified BOOLEAN DEFAULT 0,
          socialLinks TEXT,
          metrics TEXT,
          businessInfo TEXT,
          specialties TEXT,
          status TEXT DEFAULT 'ACTIVE',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch {}

    // Righe di permesso fontAuthor:* — nessun seed script le crea (i permessi
    // in questo progetto vengono inseriti out-of-band), quindi le registriamo
    // qui in modo idempotente (name è UNIQUE). SUPERADMIN/ADMIN bypassano
    // comunque il check via ruolo, quindi funzionano da subito anche prima
    // che qualcuno le assegni a un ruolo custom da /admin/roles.
    for (const action of ["read", "create", "update", "delete"]) {
      try {
        await prisma.$executeRawUnsafe(
          `INSERT OR IGNORE INTO Permission (id, name, createdAt, updatedAt) VALUES ('${crypto.randomUUID()}', 'fontAuthor:${action}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        );
      } catch {}
    }

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
      (err.code === "P2021" || err.code === "P2022" || err.code === "P2032" || err.code === "P2011");

    if (!isSchemaError) throw err;

    await ensureD1SchemaUpdated(true);
    return await run();
  }
}
