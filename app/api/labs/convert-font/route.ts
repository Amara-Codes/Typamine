import { NextRequest, NextResponse } from "next/server";
// @ts-expect-error fontverter has no official types
import fontverter from "fontverter";
import { isVariableFont, getFontFamilyName } from "@/lib/fontMeta";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function sfntExtension(buffer: Uint8Array): "otf" | "ttf" {
  const signature = Buffer.from(buffer.slice(0, 4)).toString("ascii");
  return signature === "OTTO" ? "otf" : "ttf";
}

// Endpoint pubblico (Labs Bench /labs) — stessa libreria dell'admin
// (/api/admin/fonts/convert) ma restituisce tutti e 3 i formati in un colpo
// solo invece del solo WOFF2, cosi' il tool puo' offrire subito la cascata
// completa (woff2 + woff + ttf/otf) da scaricare o incollare nel generatore.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const original = new Uint8Array(arrayBuffer);

    let sourceFormat: string;
    try {
      sourceFormat = fontverter.detectFormat(Buffer.from(original));
    } catch {
      return NextResponse.json({ error: "Unrecognized font file — expected .ttf, .otf, .woff or .woff2" }, { status: 400 });
    }

    const sfntBuffer: Uint8Array = sourceFormat === "sfnt"
      ? original
      : new Uint8Array(await fontverter.convert(Buffer.from(original), "sfnt"));

    const { isVar } = isVariableFont(sfntBuffer);
    const fontName = getFontFamilyName(sfntBuffer) || file.name.replace(/\.[^/.]+$/, "");

    const woff2Buffer: Uint8Array = sourceFormat === "woff2"
      ? original
      : new Uint8Array(await fontverter.convert(Buffer.from(sfntBuffer), "woff2"));

    const woffBuffer: Uint8Array = sourceFormat === "woff"
      ? original
      : new Uint8Array(await fontverter.convert(Buffer.from(sfntBuffer), "woff"));

    const ext = sfntExtension(sfntBuffer);

    return NextResponse.json({
      fontName,
      isVariable: isVar,
      formats: {
        woff2: { base64: Buffer.from(woff2Buffer).toString("base64"), ext: "woff2", size: woff2Buffer.length },
        woff: { base64: Buffer.from(woffBuffer).toString("base64"), ext: "woff", size: woffBuffer.length },
        sfnt: { base64: Buffer.from(sfntBuffer).toString("base64"), ext, size: sfntBuffer.length },
      },
    });
  } catch (error: any) {
    console.error("[Labs Convert Font API] Error during font conversion:", error);
    return NextResponse.json({ error: error.message || "Failed to convert font" }, { status: 500 });
  }
}
