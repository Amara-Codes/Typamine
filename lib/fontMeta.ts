// Parser SFNT hand-rolled (nessuna libreria fontkit/opentype.js in progetto) per
// estrarre family name, variable-font flag e peso/stile (tabella OS/2) da un
// buffer TTF/OTF gia' convertito in SFNT. Condiviso tra /api/admin/fonts/convert
// e /api/admin/fonts/bulk-import-zip per non duplicare il parsing byte-a-byte.

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

function findTableOffset(buffer: Uint8Array | Buffer, fontOffset: number, wantedTag: string): number {
  if (fontOffset + 12 > buffer.length) return 0;
  const numTables = readUInt16(buffer, fontOffset + 4);
  for (let i = 0; i < numTables; i++) {
    const tableRecordOffset = fontOffset + 12 + i * 16;
    if (tableRecordOffset + 4 > buffer.length) break;
    const tag = readString(buffer, tableRecordOffset, 4);
    if (tag === wantedTag) {
      return readUInt32(buffer, tableRecordOffset + 8);
    }
  }
  return 0;
}

export function isVariableFont(buffer: Uint8Array | Buffer): { isVar: boolean; tags: string[] } {
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

export function getFontFamilyName(buffer: Uint8Array | Buffer): string | null {
  const offsets = getFontOffsets(buffer);
  if (offsets.length === 0) return null;

  const fontOffset = offsets[0];
  const nameTableOffset = findTableOffset(buffer, fontOffset, "name");
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

export const WEIGHT_NAMES: Record<number, string> = {
  100: "Thin",
  200: "Extra Light",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "Semi Bold",
  700: "Bold",
  800: "Extra Bold",
  900: "Black",
};

// Legge la tabella OS/2 (usWeightClass @4, fsSelection @62) per ottenere il
// peso e lo stile reali del font invece di indovinarli dal nome del file -
// affidabile per file caricati in bulk senza metadata esterne (a differenza
// del bulk-import da provider, dove peso/stile arrivano dalla chiave del
// manifest Google/Fontshare).
export function getFontWeightAndStyle(buffer: Uint8Array | Buffer): { weight: number; style: "normal" | "italic" } {
  const offsets = getFontOffsets(buffer);
  const fallback = { weight: 400, style: "normal" as const };
  if (offsets.length === 0) return fallback;

  const os2Offset = findTableOffset(buffer, offsets[0], "OS/2");
  if (os2Offset === 0 || os2Offset + 64 > buffer.length) return fallback;

  const rawWeight = readUInt16(buffer, os2Offset + 4);
  const fsSelection = readUInt16(buffer, os2Offset + 62);
  const italic = (fsSelection & 0x01) !== 0;

  // usWeightClass e' teoricamente 100-900 ma alcuni font "creativi" ci
  // infilano valori fuori scala: clampiamo sul piu' vicino step da 100 valido.
  const weight = rawWeight >= 100 && rawWeight <= 900
    ? Math.round(rawWeight / 100) * 100
    : 400;

  return { weight, style: italic ? "italic" : "normal" };
}

export function getVariantLabel(weight: number, style: "normal" | "italic"): string {
  const base = WEIGHT_NAMES[weight] || `Weight ${weight}`;
  return style === "italic" ? `${base} Italic` : base;
}
