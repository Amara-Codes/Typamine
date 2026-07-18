// lib/fontshare.ts
import { Ingredient, FontVariant, ProviderFontItem } from '@/types';


export enum FontshareCategory {
  Sans = 'Sans',
  Serif = 'Serif',
  Slab = 'Slab',
  Display = 'Display',
  Handwritten = 'Handwritten',
  Script = 'Script'
}

export enum FontsharePersonality {
  Informal = 'Informal',
  Modern = 'Modern',
  Corporate = 'Corporate',
  Classic = 'Classic',
  Elegant = 'Elegant',
  Dramatic = 'Dramatic',
  Clean = 'Clean',
  Futuristic = 'Futuristic',
  Serious = 'Serious',
  Dirty = 'Dirty',
  Luxurious = 'Luxurious',
  Friendly = 'Friendly',
  Abstract = 'Abstract'
}

export interface FontshareQueryParams {
  limit?: number;
  offset?: number;
  categories?: FontshareCategory[];
  personalities?: FontsharePersonality[];
  orderBy?: 'popularity' | 'name' | 'hot';
}

/**
 * Funzione per recuperare i font da Fontshare e mapparli al tuo schema DB
 */
export async function fetchFontshareFonts(params: FontshareQueryParams = {}): Promise<ProviderFontItem[]> {
  const {
    limit = 20,
    offset = 0,
    categories = [],
    personalities = [],
    orderBy = 'popularity'
  } = params;

  // 1. Costruzione dell'URL con i parametri
  const baseUrl = new URL('https://api.fontshare.com/v2/fonts');
  baseUrl.searchParams.append('limit', limit.toString());
  baseUrl.searchParams.append('offset', offset.toString());
  orderBy !== 'popularity' && baseUrl.searchParams.append('sorting', orderBy);

  // Fontshare usa array nella query string (es. categories[]=Display)
  categories.forEach(cat => baseUrl.searchParams.append('categories[]', cat));
  personalities.forEach(pers => baseUrl.searchParams.append('personalities[]', pers));

  console.log(`[Fontshare API] Richiesta in corso: ${baseUrl.toString()}`);

  try {
    // 2. Chiamata API
    const res = await fetch(baseUrl.toString());
    
    if (!res.ok) {
      console.error(`[Fontshare API] Richiesta fallita con status ${res.status}`);
      return [];
    }

    const data = await res.json();
    console.log(`[Fontshare API] Trovati ${data.fonts ? data.fonts.length : 0} font (su ${data.count_total} totali).`);

    if (!data.fonts || data.fonts.length === 0) {
      return [];
    }

    // 3. Mappatura dei dati nel tuo formato "ProviderFontItem"
    const items: ProviderFontItem[] = data.fonts.map((font: any) => {
      
      // Popoliamo il campo designer (che nel DB diventerà "creator") 
      // prendendo solo il primo risultato dall'array designers come richiesto.
      const creatorName = font.designers && font.designers.length > 0 
        ? font.designers[0].name 
        : font.publisher?.name || 'Sconosciuto';

      // Verifichiamo se c'è almeno una variante variabile
      const isVariable = font.styles.some((style: any) => style.is_variable);

      const providerItem: ProviderFontItem = {
        family: font.name,
        category: font.category || 'Unknown',
        provider: 'fontshare',
        designer: creatorName,
        files: {}
      };

      if (isVariable) {
        // Mock axes data to signal that it's variable in the UI
        providerItem.axes = [{ tag: 'wght', start: 100, end: 900 }];
      }

      // Costruiamo il dictionary `files` in modo simile a Google Fonts
      font.styles.forEach((style: any) => {
        let fileUrl = style.file.startsWith('//') 
          ? `https:${style.file}` 
          : style.file;
        
        // Fontshare omits the extension in its JSON API. We must append .woff2 to get a 200 response.
        if (!fileUrl.match(/\.\w{3,5}$/)) {
          fileUrl += '.woff2';
        }
          
        let key = "regular";
        if (style.is_italic) {
          key = style.weight.number === 400 ? "italic" : `${style.weight.number}italic`;
        } else {
          key = style.weight.number === 400 ? "regular" : `${style.weight.number}`;
        }
        
        providerItem.files[key] = fileUrl;
      });

      return providerItem;
    });

    return items;

  } catch (error) {
    console.error(`[Fontshare API] Errore durante il fetching o parsing dei dati:`, error);
    return [];
  }
}