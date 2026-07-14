export interface FontVariant {
  id: string;             // UUID della variante
  fontFamilyName: string; // es: "Typamine_Inter" (Usa lo STESSO nome per tutte le varianti di Inter)
  weight: number;         // es: 400, 700 (Meglio numero che stringa per logiche UI)
  style: 'normal' | 'italic' | 'oblique'; // es: "normal"
  woff2Url: string;       // es: "https://cdn.typamine.com/fonts/inter/inter-regular.woff2"
  label: string;          // es: "Regular" o "Bold" (Utile per la UI)
}

export interface Ingredient {
  id: string;
  name: string;           // "Inter"
  slug: string;           // "inter"
  category: string;
  creator?: string;
  rating: string;
  symbol?: string;
  formula?: string;
  
  // Sostituiamo i vecchi campi singoli con un array
  variants: FontVariant[]; 
}
export interface PlaygroundFont {
  name: string;
  fontFamily: string;
}

export interface Formula {
  id: string;
  name: string;
  description: string;
  href: string;
  fonts: Ingredient[];
  code?: string;
  createdAt: string;
}

export interface Prescription {
  id: string;
  name: string;
  href: string;
  fonts: Ingredient[];
  description?: string;
  imgUrl?: string;
  tags: string[];
}
