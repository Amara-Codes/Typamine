export interface FontVariant {
  id: string;             // UUID della variante
  fontFamilyName: string; // es: "Typamine_Inter" (Usa lo STESSO nome per tutte le varianti di Inter)
  weight: number;         // es: 400, 700 (Meglio numero che stringa per logiche UI)
  style: 'normal' | 'italic' | 'oblique'; // es: "normal"
  woff2Url: string;       // es: "https://cdn.typamine.com/fonts/inter/inter-regular.woff2"
  label: string;          // es: "Regular" o "Bold" (Utile per la UI)
}

export interface Tag {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
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
  isVariable?: boolean;
  createdAt?: string;
  updatedAt?: string;
  tags?: Tag[];

  // Sostituiamo i vecchi campi singoli con un array
  variants: FontVariant[];
}

export interface ProviderFontItem {
  family: string;
  category: string;
  files: Record<string, string>;
  axes?: Array<{ tag: string; start: number; end: number }>;
  provider: 'google' | 'fontshare';
  designer?: string;
}
export interface PlaygroundFont {
  name: string;
  fontFamily: string;
  /** Real font file URL — when set, LivePreview injects an actual @font-face instead of relying on `fontFamily` already being loaded. */
  fontUrl?: string;
}

export interface Formula {
  id: string;
  name: string;
  description?: string;
  slug: string;
  fonts: Ingredient[];
  tags: Tag[];
  fontCategory: string;
  createdAt: string;
  updatedAt: string;
}

// Entità SEO condivisa — un unico set di meta-tag riusabile da qualunque
// contenuto pubblico (archive, blog article, prescription, ...) invece di
// duplicare gli stessi campi su ogni modello/form.
export interface SeoModule {
  id: string;
  metaTitle?: string;
  metaDescription?: string;
  /** Stringa singola comma-separated, stesso formato storico del meta tag "keywords". */
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  ogImageAlt?: string;
  twitterCard?: "summary" | "summary_large_image";
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImageUrl?: string;
  twitterImageAlt?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

export interface Prescription {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  insight?: string;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
  primaryFontId?: string;
  primaryFont?: Ingredient;
  secondaryFontId?: string;
  secondaryFont?: Ingredient;
  tags?: (Tag | string)[];
  seoId?: string;
  seo?: SeoModule;

  // Backward compatibility fields for legacy UI components
  href?: string;
  fonts?: Ingredient[];
  imgUrl?: string;
}

export interface PostAuthor {
  id: string;
  name?: string;
  surname?: string;
  imageUrl?: string;
}

export type PostType = "ARCHIVE" | "BLOG";

// Entità generica di contenuto editoriale: serve sia /archive (postType
// "ARCHIVE") che /blog (postType "BLOG") — stessi campi, stesso editor di
// content-module, l'unica differenza è la varietà di moduli offerta in admin.
export interface Post {
  id: string;
  postType: PostType;
  title: string;
  slug: string;
  caption?: string;
  description?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  imageAlt?: string;
  insight?: string;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
  authorId?: string;
  author?: PostAuthor;
  tags?: Tag[];
  fonts?: Ingredient[];
  seoId?: string;
  seo?: SeoModule;

  // Backward compatibility per componenti card generici (stesso pattern di Prescription.href/imgUrl)
  href?: string;
  imgUrl?: string;
}
