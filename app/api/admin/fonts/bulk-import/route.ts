import { NextRequest, NextResponse } from "next/server";
// @ts-expect-error fontverter has no official types
import fontverter from "fontverter";
import prisma from "@/lib/prisma";
import { uploadToR2 } from "@/lib/r2";
import crypto from "crypto";

interface ProviderFontImportItem {
  family: string;
  category: string;
  files: Record<string, string>;
  axes?: Array<{ tag: string; start: number; end: number }>;
  provider?: string;
  designer?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fonts = body.fonts as ProviderFontImportItem[];
    if (!fonts || !Array.isArray(fonts)) {
      return NextResponse.json({ error: "Missing fonts array" }, { status: 400 });
    }

    const imported: string[] = [];
    const failed: Array<{ family: string; error: string }> = [];

    const categoryMapping: Record<string, string> = {
      "sans-serif": "Sans-Serif",
      "serif": "Serif",
      "monospace": "Monospace",
      "display": "Decorative",
      "handwriting": "Decorative"
    };

    for (const font of fonts) {
      try {
        const slug = font.family
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");

        // Check if already exists
        const existing = await prisma.ingredient.findUnique({
          where: { slug }
        });
        if (existing) {
          failed.push({ family: font.family, error: "Font family already exists in database." });
          continue;
        }

        const isVariable = font.axes && font.axes.length > 0;
        const dbCategory = categoryMapping[font.category.toLowerCase()] || "Sans-Serif";
        const ingredientId = crypto.randomUUID();
        const fontFamilyName = `Typamine_${font.family.replace(/\s+/g, "")}`;

        // Choose which variants to process
        let keysToProcess: string[] = [];
        if (isVariable) {
          // If variable, we only import one file (prefer regular or first available)
          const preferredKeys = ["regular", "400", "500", "600", "700"];
          const key = preferredKeys.find(k => font.files[k]) || Object.keys(font.files)[0];
          if (key) keysToProcess.push(key);
        } else {
          // Static font: process all files
          keysToProcess = Object.keys(font.files);
        }

        if (keysToProcess.length === 0) {
          throw new Error("No font files available for this family.");
        }

        const createdVariants: Array<{
          id: string;
          fontFamilyName: string;
          weight: number;
          style: string;
          woff2Url: string;
          label: string;
        }> = [];

        // Download, convert (if needed) and upload each variant
        for (const key of keysToProcess) {
          const fileUrl = font.files[key];
          
          // Download
          const fileRes = await fetch(fileUrl);
          if (!fileRes.ok) {
            throw new Error(`Failed to download variant ${key} from ${fileUrl}`);
          }
          
          const arrayBuffer = await fileRes.arrayBuffer();
          let fileBuffer = Buffer.from(arrayBuffer);

          // Check if format is WOFF2 (magic number: 'wOF2')
          const isWoff2 = fileBuffer.length >= 4 &&
            fileBuffer[0] === 0x77 &&
            fileBuffer[1] === 0x4F &&
            fileBuffer[2] === 0x46 &&
            fileBuffer[3] === 0x32;

          if (!isWoff2) {
            try {
              fileBuffer = await fontverter.convert(fileBuffer, "woff2");
            } catch (convErr: any) {
              console.error(`[Bulk Import] Fontverter conversion failed for ${font.family} - ${key}:`, convErr);
              throw new Error(`Failed to convert ${key} format to WOFF2.`);
            }
          }

          // Upload to R2
          const variantId = crypto.randomUUID();
          const fileName = `${variantId}.woff2`;
          const uploadRes = await uploadToR2(
            fileBuffer,
            "fonts/files",
            fileName,
            "font/woff2"
          );

          // Parse metadata for DB
          let weight = 400;
          let style = "normal";
          let label = "Regular";

          if (isVariable) {
            label = "Variable";
          } else {
            // Helper parsing for static variants
            if (key === "regular") {
              weight = 400;
              style = "normal";
              label = "Regular";
            } else if (key === "italic") {
              weight = 400;
              style = "italic";
              label = "Italic";
            } else {
              style = key.includes("italic") ? "italic" : "normal";
              weight = parseInt(key.replace("italic", ""), 10) || 400;
              
              const weightNames: Record<number, string> = {
                100: "Thin",
                200: "Extra Light",
                300: "Light",
                400: "Regular",
                500: "Medium",
                600: "Semi Bold",
                700: "Bold",
                800: "Extra Bold",
                900: "Black"
              };
              const base = weightNames[weight] || `Weight ${weight}`;
              label = style === "italic" ? `${base} Italic` : base;
            }
          }

          createdVariants.push({
            id: variantId,
            fontFamilyName,
            weight,
            style,
            woff2Url: uploadRes.url,
            label
          });
        }

        // Save to DB
        await prisma.ingredient.create({
          data: {
            id: ingredientId,
            name: font.family,
            slug,
            category: dbCategory,
            creator: font.designer || (font.provider === 'fontshare' ? 'Fontshare' : 'Google Fonts'),
            rating: "9.0",
            isVariable,
            createdAt: new Date(),
            variants: {
              create: createdVariants
            }
          }
        });

        imported.push(font.family);
      } catch (fontErr: any) {
        console.error(`[Bulk Import] Error importing font ${font.family}:`, fontErr);
        failed.push({ family: font.family, error: fontErr.message || "Unknown error" });
      }
    }

    return NextResponse.json({ success: true, imported, failed });
  } catch (error: any) {
    console.error("[Bulk Import Route] Global Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process bulk import request." }, { status: 500 });
  }
}
