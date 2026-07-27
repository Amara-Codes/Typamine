import { NextRequest, NextResponse } from "next/server";
// @ts-expect-error fontverter has no official types
import fontverter from "fontverter";
import { isVariableFont, getFontFamilyName } from "@/lib/fontMeta";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // 1. Detect format
    const format = fontverter.detectFormat(Buffer.from(buffer));
    console.log(`[Font Convert API] Detected format: ${format} for file: ${file.name}`);

    // 2. Convert to SFNT (TTF/OTF) to check if it's variable
    let sfntBuffer: Uint8Array;
    if (format === "sfnt") {
      sfntBuffer = buffer;
    } else {
      const converted = await fontverter.convert(Buffer.from(buffer), "sfnt");
      sfntBuffer = new Uint8Array(converted);
    }

    const { isVar, tags } = isVariableFont(sfntBuffer);
    const fontName = getFontFamilyName(sfntBuffer) || file.name.replace(/\.[^/.]+$/, "");
    console.log(`[Font Convert API] Is variable font? ${isVar}, Extracted name: ${fontName}`);
    console.log(`[Font Convert API] Font tables found: ${JSON.stringify(tags)}`);

    // 3. Convert to WOFF2
    let woff2Buffer: Uint8Array;
    if (format === "woff2") {
      woff2Buffer = buffer;
    } else {
      const converted = await fontverter.convert(Buffer.from(sfntBuffer), "woff2");
      woff2Buffer = new Uint8Array(converted);
    }

    // 4. Return converted file as response along with headers for client metadata
    const response = new NextResponse(woff2Buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "font/woff2",
        "Content-Disposition": `attachment; filename="${file.name.replace(/\.[^/.]+$/, "")}.woff2"`,
        "X-Is-Variable": isVar ? "true" : "false",
        "X-Font-Name": encodeURIComponent(fontName),
      },
    });

    return response;
  } catch (error: any) {
    console.error("[Font Convert API] Error during font conversion:", error);
    return NextResponse.json({ error: error.message || "Failed to convert font" }, { status: 500 });
  }
}
