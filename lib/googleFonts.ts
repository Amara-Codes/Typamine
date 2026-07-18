function cleanFontFamilyName(name: string): string {
  const suffixes = [
    "regular", "italic", "bold", "light", "thin", "medium", 
    "black", "extrabold", "extralight", "semibold", "ultralight", 
    "heavy", "hairline", "oblique", "condensed", "expanded"
  ];
  
  let cleaned = name.trim();
  let found = true;
  
  while (found) {
    found = false;
    const lower = cleaned.toLowerCase();
    for (const suffix of suffixes) {
      if (lower.endsWith(" " + suffix)) {
        cleaned = cleaned.substring(0, cleaned.length - (suffix.length + 1)).trim();
        found = true;
        break;
      } else if (lower.endsWith("-" + suffix)) {
        cleaned = cleaned.substring(0, cleaned.length - (suffix.length + 1)).trim();
        found = true;
        break;
      }
    }
  }
  
  return cleaned;
}

export async function fetchGoogleFontCategory(familyName: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_FONTS_API_KEY;
  if (!apiKey) {
    console.warn("[Google Fonts API] GOOGLE_FONTS_API_KEY is not defined in environment variables.");
    return null;
  }

  const cleanedFamily = cleanFontFamilyName(familyName);
  console.log(`[Google Fonts API] Query received family: "${familyName}", Cleaned family for search: "${cleanedFamily}"`);

  try {
    const url = `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&family=${encodeURIComponent(cleanedFamily)}`;
    console.log(`[Google Fonts API] Requesting Google API URL: ${url}`);
    
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[Google Fonts API] Request failed with status ${res.status}`);
      return null;
    }

    const data = await res.json();
    console.log(`[Google Fonts API] Raw response items count: ${data.items ? data.items.length : 0}`);
    console.log(`[Google Fonts API] Raw response data:`, JSON.stringify(data, null, 2));

    if (data.items && data.items.length > 0) {
      const match = data.items.find(
        (item: any) => item.family.toLowerCase() === cleanedFamily.toLowerCase()
      ) || data.items[0];

      console.log(`[Google Fonts API] Matched item:`, match);

      if (match && match.category) {
        return match.category;
      }
    }

    return null;
  } catch (error) {
    console.error(`[Google Fonts API] Error fetching font info:`, error);
    return null;
  }
}
