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

// Stringhe libere a livello DB/tipo (stessa convenzione di `category`) — le
// opzioni ammesse in UI sono vincolate dalla select in FontForm, non da un
// enum Prisma.
export type ImportedFrom = 'Google Fonts' | 'Fontshare' | 'Local Single Upload' | 'Local Bulk Upload';
export type LicenseType =
  | 'Free'
  | 'Free for Personal Use'
  | 'Demo'
  | 'Donationware'
  | 'Public Domain'
  | 'Open Source (SIL OFL)'
  | 'Commercial';

export interface IngredientAuthorSummary {
  id: string;
  name: string;
  slug: string;
  avatarUrl?: string;
  isVerified?: boolean;
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
  importedFrom?: ImportedFrom | string;
  licenseType?: LicenseType | string;
  isVariable?: boolean;
  /** Media dei voti utente 1-5 (non l'editoriale `rating` sopra) */
  userRating?: number;
  userRatingsCount?: number;
  authorId?: string;
  /** Riassunto leggero del FontAuthor collegato (non l'intera entità) — usare `font.author?.name` per mostrare l'autore in UI, con fallback a `font.creator` se non è collegato nessun FontAuthor. */
  author?: IngredientAuthorSummary;
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

// ==========================================
// FONT AUTHOR
// ==========================================
// Nota: createdAt/updatedAt tipizzati come `string` (ISO), non `Date | string`
// — stessa convenzione post-serializzazione usata da tutte le altre entità
// in questo file (Tag, Ingredient, Prescription, Post...).

export type AuthorType = 'INDIVIDUAL' | 'FOUNDRY' | 'COLLECTIVE' | 'UNKNOWN';

export type SocialPlatform =
  | 'github'
  | 'twitter'
  | 'instagram'
  | 'behance'
  | 'dribbble'
  | 'linkedin'
  | 'youtube';

export interface SocialLinks {
  platform: SocialPlatform;
  url: string;
  handle?: string;
}

export interface DonationDetails {
  /** URL per donazioni dirette (Patreon, Ko-fi, BuyMeACoffee, PayPal, ecc.) */
  donationWebsite?: string;
  /** Indirizzi wallet per criptovalute */
  cryptoWallets?: {
    bitcoin?: string;
    ethereum?: string;
    solana?: string;
  };
  preferredMethod?: 'kofi' | 'patreon' | 'paypal' | 'crypto' | 'custom';
}

export interface AuthorRating {
  /** Punteggio medio (es. 4.8) */
  average: number;
  /** Numero totale di recensioni/voti ricevuti */
  totalReviews: number;
  /** Distribuzione opzionale dei voti da 1 a 5 stelle */
  distribution?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface AuthorMetrics {
  /** Numero totale di font pubblicati nel sistema */
  totalFontsCount: number;
  /** Download complessivi di tutti i suoi font */
  totalDownloads: number;
  /** Numero di follower sulla piattaforma Tyamine */
  followersCount: number;
  /** Rating aggregato */
  usersRating: AuthorRating;
}

export interface BusinessInfo {
  /** Nome dell'azienda o studio legale (se diverso da name) */
  companyName?: string;
  /** Numero di Partita IVA / Tax ID */
  vatId?: string;
  /** Indirizzo fisico/legale */
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country: string; // Codice ISO-2 (es. 'IT', 'US', 'DE')
  };
}

export interface FontAuthor {
  /** Identifier unico (UUID) */
  id: string;

  /** Slug unico per URL puliti (es. /authors/roberto-barbagallo) */
  slug: string;

  /** Nome visibile dell'autore o della fonderia (es. "Dalton Maag" o "John Doe") */
  name: string;

  /** Tipologia di autore: singolo designer, fonderia o collettivo */
  type: AuthorType;

  /** Email principale di contatto */
  email: string;

  /** Email dedicata al supporto per problemi sulle licenze/font (opzionale) */
  supportEmail?: string;

  /** Avatar / Foto profilo */
  avatarUrl?: string;

  /** Immagine di copertina per la pagina profilo */
  bannerUrl?: string;

  /** Bio o descrizione dell'autore (supporta Markdown) */
  bio?: string;

  /** Sito web ufficiale dell'autore o della fonderia */
  website?: string;

  /** Dettagli per le donazioni / il supporto finanziario */
  donation: DonationDetails;

  /** Nazionalità dell'autore o sede legale (codice ISO 3166-1 alpha-2, es. "IT", "FI", "SE") */
  nationality?: string;

  /** Lingue parlate / gestite per il supporto */
  languagesSpoken?: string[];

  /** Profilo verificato su Tyamine (spunta blu) */
  isVerified: boolean;

  /** Link ai profili social dell'autore */
  socialLinks?: SocialLinks[];

  /** Metriche di utilizzo, download e votazioni degli utenti */
  metrics: AuthorMetrics;

  /** Informazioni aziendali/fiscali (utili se vende font commerciali) */
  businessInfo?: BusinessInfo;

  /** Tag/specializzazioni principali (es. ["Serif", "Pixel Art", "Calligraphy"]) */
  specialties?: string[];

  /** Stato dell'account dell'autore sulla piattaforma */
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

  /** Timestamps per tracciamento database */
  createdAt?: string;
  updatedAt?: string;
}
