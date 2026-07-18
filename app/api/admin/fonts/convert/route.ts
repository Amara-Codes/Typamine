import { NextRequest, NextResponse } from "next/server";
// @ts-expect-error fontverter has no official types
import fontverter from "fontverter";

function readUInt16(buffer: Uint8Array | Buffer, offset: number): number {
  return (buffer[offset] << 8) | buffer[offset + 1];
}

function readUInt32(buffer: Uint8Array | Buffer, offset: number): number {
  return ((buffer[offset] << 24) >>> 0) |
         (buffer[offset + 1] << 16) |
         (buffer[offset + 2] << 8) |
         buffer[offset + 3];
}

function readString(buffer: Uint8Array | Buffer, offset: number, length: number): string {
  let str = "";
  for (let i = 0; i < length; i++) {
    str += String.fromCharCode(buffer[offset + i]);
  }
  return str;
}

function getFontOffsets(buffer: Uint8Array | Buffer): number[] {
  if (buffer.length < 12) return [];
  const tag = readString(buffer, 0, 4);
  if (tag === "ttcf") {
    const numFonts = readUInt32(buffer, 8);
    const offsets: number[] = [];
    for (let i = 0; i < numFonts; i++) {
      const offsetPos = 12 + i * 4;
      if (offsetPos + 4 > buffer.length) break;
      offsets.push(readUInt32(buffer, offsetPos));
    }
    return offsets;
  }
  return [0];
}

function isVariableFont(buffer: Uint8Array | Buffer): { isVar: boolean; tags: string[] } {
  const offsets = getFontOffsets(buffer);
  if (offsets.length === 0) return { isVar: false, tags: [] };
  
  const allTags: string[] = [];
  for (const fontOffset of offsets) {
    if (fontOffset + 12 > buffer.length) continue;
    const numTables = readUInt16(buffer, fontOffset + 4);
    
    for (let i = 0; i < numTables; i++) {
      const tableRecordOffset = fontOffset + 12 + i * 16;
      if (tableRecordOffset + 4 > buffer.length) break;
      const tag = readString(buffer, tableRecordOffset, 4);
      if (!allTags.includes(tag)) {
        allTags.push(tag);
      }
      if (tag === "fvar") {
        return { isVar: true, tags: allTags };
      }
    }
  }
  return { isVar: false, tags: allTags };
}

function getFontFamilyName(buffer: Uint8Array | Buffer): string | null {
  const offsets = getFontOffsets(buffer);
  if (offsets.length === 0) return null;
  
  const fontOffset = offsets[0];
  if (fontOffset + 12 > buffer.length) return null;
  
  const numTables = readUInt16(buffer, fontOffset + 4);
  let nameTableOffset = 0;
  for (let i = 0; i < numTables; i++) {
    const tableRecordOffset = fontOffset + 12 + i * 16;
    if (tableRecordOffset + 4 > buffer.length) break;
    const tag = readString(buffer, tableRecordOffset, 4);
    if (tag === "name") {
      nameTableOffset = readUInt32(buffer, tableRecordOffset + 8);
      break;
    }
  }

  if (nameTableOffset === 0 || nameTableOffset + 6 > buffer.length) return null;

  const count = readUInt16(buffer, nameTableOffset + 2);
  const stringOffset = readUInt16(buffer, nameTableOffset + 4);

  let familyName: string | null = null;
  let fullName: string | null = null;

  for (let i = 0; i < count; i++) {
    const recordOffset = nameTableOffset + 6 + i * 12;
    if (recordOffset + 12 > buffer.length) break;

    const platformID = readUInt16(buffer, recordOffset);
    const nameID = readUInt16(buffer, recordOffset + 6);
    const length = readUInt16(buffer, recordOffset + 8);
    const offset = readUInt16(buffer, recordOffset + 10);

    if (nameID === 1 || nameID === 4) {
      const stringStart = nameTableOffset + stringOffset + offset;
      if (stringStart + length > buffer.length) continue;

      let nameStr = "";
      if (platformID === 3 || platformID === 0) {
        for (let j = 0; j < length - 1; j += 2) {
          const charCode = (buffer[stringStart + j] << 8) | buffer[stringStart + j + 1];
          nameStr += String.fromCharCode(charCode);
        }
      } else {
        nameStr = readString(buffer, stringStart, length);
      }

      nameStr = nameStr.replace(/\0/g, "").trim();
      if (nameStr) {
        if (nameID === 4) {
          fullName = nameStr;
        } else if (nameID === 1) {
          familyName = nameStr;
        }
      }
    }
  }

  return fullName || familyName || null;
}

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
