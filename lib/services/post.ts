import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { Post, PostType, Ingredient, FontVariant } from "@/types";
import { withSafeDbQuery } from "./dbMigration";
import { toSeoModule } from "./seo";
import { CACHE_TAGS } from "@/lib/cacheTags";

function mapIngredient(rec: any): Ingredient {
  return {
    id: rec.id,
    name: rec.name,
    slug: rec.slug,
    category: rec.category,
    creator: rec.creator ?? undefined,
    rating: rec.rating,
    symbol: rec.symbol ?? undefined,
    formula: rec.formula ?? undefined,
    importedFrom: rec.importedFrom ?? undefined,
    licenseType: rec.licenseType ?? undefined,
    isVariable: rec.isVariable,
    userRating: rec.userRating ?? 0,
    userRatingsCount: rec.userRatingsCount ?? 0,
    authorId: rec.authorId ?? undefined,
    author: rec.author
      ? { id: rec.author.id, name: rec.author.name, slug: rec.author.slug, avatarUrl: rec.author.avatarUrl ?? undefined, isVerified: rec.author.isVerified }
      : undefined,
    createdAt: rec.createdAt?.toISOString(),
    updatedAt: rec.updatedAt?.toISOString(),
    variants: (rec.variants || []).map((v: any): FontVariant => ({
      id: v.id,
      fontFamilyName: v.fontFamilyName,
      weight: v.weight,
      style: v.style as FontVariant["style"],
      woff2Url: v.woff2Url,
      label: v.label,
    })),
  };
}

function toPost(record: any): Post {
  const postType: PostType = record.postType === "BLOG" ? "BLOG" : "ARCHIVE";
  const routeBase = postType === "BLOG" ? "pills" : "archive";
  return {
    id: record.id,
    postType,
    title: record.title,
    slug: record.slug,
    caption: record.caption ?? undefined,
    description: record.description ?? undefined,
    thumbnailUrl: record.thumbnailUrl ?? undefined,
    imageUrl: record.imageUrl ?? undefined,
    imageAlt: record.imageAlt ?? undefined,
    insight: record.insight ?? undefined,
    published: record.published,
    createdAt: record.createdAt?.toISOString(),
    updatedAt: record.updatedAt?.toISOString(),
    authorId: record.authorId,
    author: record.author
      ? {
          id: record.author.id,
          name: record.author.name ?? undefined,
          surname: record.author.surname ?? undefined,
          imageUrl: record.author.imageUrl ?? undefined,
        }
      : undefined,
    tags: (record.tags || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      description: t.description ?? undefined,
    })),
    fonts: (record.fonts || []).map(mapIngredient),
    seoId: record.seoId ?? undefined,
    seo: toSeoModule(record.seo),

    // Backward compatibility con componenti card generici (stesso pattern di Prescription)
    href: `/${routeBase}/${record.slug}`,
    imgUrl: record.thumbnailUrl ?? record.imageUrl ?? undefined,
  };
}

const AUTHOR_SELECT = {
  select: { id: true, name: true, surname: true, imageUrl: true },
} as const;

export interface PostsPageResult {
  items: Post[];
  total: number;
  page: number;
  perPage: number;
}

export const getRecentPosts = unstable_cache(
  async (postType: PostType, limit = 4): Promise<Post[]> => {
    const records = await withSafeDbQuery(() =>
      prisma.post.findMany({
        where: { published: true, postType },
        include: {
          author: AUTHOR_SELECT,
          tags: true,
          fonts: { include: { variants: true, author: true } },
          seo: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
    );
    return records.map(toPost);
  },
  ["posts-recent"],
  { revalidate: 300, tags: [CACHE_TAGS.posts] }
);

export type PostSort = "recent" | "name_asc" | "name_desc";

export interface GetPostsPageOptions {
  postType: PostType;
  page?: number;
  perPage?: number;
  publishedOnly?: boolean;
  /** Post che hanno ALMENO UNO di questi tag (unione, non intersezione). */
  tagIds?: string[];
  search?: string;
  sort?: PostSort;
}

export const getPostsPage = unstable_cache(
  async (options: GetPostsPageOptions): Promise<PostsPageResult> => {
  const page = options.page ?? 1;
  const perPage = options.perPage ?? 12;

  // Ogni filtro è un blocco indipendente combinato in AND — vedi lo stesso
  // commento in lib/services/pairing.ts sul perché non stare tutti su where.OR.
  const and: any[] = [{ postType: options.postType }];
  if (options.publishedOnly) and.push({ published: true });
  if (options.tagIds && options.tagIds.length > 0) {
    and.push({ tags: { some: { id: { in: options.tagIds } } } });
  }
  if (options.search) {
    and.push({
      OR: [
        { title: { contains: options.search } },
        { caption: { contains: options.search } },
        { description: { contains: options.search } },
      ],
    });
  }
  const where: any = { AND: and };

  const orderBy =
    options.sort === "name_asc" ? { title: "asc" as const }
    : options.sort === "name_desc" ? { title: "desc" as const }
    : { createdAt: "desc" as const };

  const total = await withSafeDbQuery(() => prisma.post.count({ where }));
  const records = await withSafeDbQuery(() =>
    prisma.post.findMany({
      where,
      include: {
        author: AUTHOR_SELECT,
        tags: true,
        fonts: { include: { variants: true, author: true } },
        seo: true,
      },
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    })
  );

  return {
    items: records.map(toPost),
    total,
    page,
    perPage,
  };
  },
  ["posts-page"],
  { revalidate: 60, tags: [CACHE_TAGS.posts] }
);

export const getPosts = unstable_cache(
  async (options: { postType: PostType; publishedOnly?: boolean }): Promise<Post[]> => {
    const where: any = { postType: options.postType, ...(options.publishedOnly ? { published: true } : {}) };

    const records = await withSafeDbQuery(() =>
      prisma.post.findMany({
        where,
        include: {
          author: AUTHOR_SELECT,
          tags: true,
          fonts: { include: { variants: true, author: true } },
          seo: true,
        },
        orderBy: { createdAt: "desc" },
      })
    );

    return records.map(toPost);
  },
  ["posts-all"],
  { revalidate: 60, tags: [CACHE_TAGS.posts] }
);

export async function getPostById(id: string): Promise<Post | null> {
  const record = await withSafeDbQuery(() =>
    prisma.post.findUnique({
      where: { id },
      include: {
        author: AUTHOR_SELECT,
        tags: true,
        fonts: { include: { variants: true, author: true } },
        seo: true,
      },
    })
  );

  return record ? toPost(record) : null;
}

export const getPostBySlug = unstable_cache(
  async (slug: string): Promise<Post | null> => {
    const record = await withSafeDbQuery(() =>
      prisma.post.findUnique({
        where: { slug },
        include: {
          author: AUTHOR_SELECT,
          tags: true,
          fonts: { include: { variants: true, author: true } },
          seo: true,
        },
      })
    );

    return record ? toPost(record) : null;
  },
  ["post-by-slug"],
  { revalidate: 300, tags: [CACHE_TAGS.posts] }
);
