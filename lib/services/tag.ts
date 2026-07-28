import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { Tag } from "@/types";
import { withSafeDbQuery } from "./dbMigration";
import { CACHE_TAGS } from "@/lib/cacheTags";

export const getTags = unstable_cache(
  async (): Promise<Tag[]> => {
    const records = await withSafeDbQuery(() =>
      prisma.tag.findMany({
        orderBy: {
          name: "asc",
        },
      })
    );

    return records.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description ?? undefined,
      createdAt: t.createdAt?.toISOString(),
      updatedAt: t.updatedAt?.toISOString(),
    }));
  },
  ["tags-all"],
  { revalidate: 600, tags: [CACHE_TAGS.tags] }
);

export async function getTagById(id: string): Promise<Tag | null> {
  const record = await withSafeDbQuery(() =>
    prisma.tag.findUnique({
      where: { id },
    })
  );

  if (!record) return null;

  return {
    id: record.id,
    name: record.name,
    description: record.description ?? undefined,
    createdAt: record.createdAt?.toISOString(),
    updatedAt: record.updatedAt?.toISOString(),
  };
}
