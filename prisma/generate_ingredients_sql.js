const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load sample fonts data
const fonts = JSON.parse(fs.readFileSync(path.join(__dirname, '../lib/sample-data/fonts.json'), 'utf8'));

let sql = '-- Seed Ingredients and Variants with UUIDs\n';

for (const font of fonts) {
  const ingredientId = crypto.randomUUID();
  const symbol = font.symbol || null;
  const formula = font.formula || null;
  const rating = font.rating || '0.0';
  const creator = font.creator || null;
  const category = font.category || 'Unknown';
  
  // Escape names for SQL
  const safeName = font.name.replace(/'/g, "''");
  const safeCategory = category.replace(/'/g, "''");
  const safeCreator = creator ? creator.replace(/'/g, "''") : null;
  
  sql += `INSERT INTO "Ingredient" ("id", "name", "slug", "category", "creator", "rating", "symbol", "formula") VALUES ('${ingredientId}', '${safeName}', '${font.slug}', '${safeCategory}', ${safeCreator ? `'${safeCreator}'` : 'NULL'}, '${rating}', ${symbol ? `'${symbol}'` : 'NULL'}, ${formula ? `'${formula}'` : 'NULL'}) ON CONFLICT("slug") DO NOTHING;\n`;
  
  if (font.variants && font.variants.length > 0) {
    for (const variant of font.variants) {
      const variantId = crypto.randomUUID();
      // Look up if ingredient was already inserted, but we assume new seeding.
      // We map variants to the generated ingredientId.
      sql += `INSERT INTO "FontVariant" ("id", "fontFamilyName", "weight", "style", "woff2Url", "label", "ingredientId") SELECT '${variantId}', '${variant.fontFamilyName}', ${variant.weight}, '${variant.style}', '${variant.woff2Url}', '${variant.label}', "id" FROM "Ingredient" WHERE "slug" = '${font.slug}';\n`;
    }
  }
}

fs.writeFileSync(path.join(__dirname, 'seed_ingredients.sql'), sql);
console.log('Generated seed_ingredients.sql successfully!');
