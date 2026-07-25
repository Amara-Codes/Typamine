"use server";

import prisma from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { uploadToR2, deleteFromR2 } from "@/lib/r2";
import { withSafeDbQuery } from "@/lib/services/dbMigration";
import { parseSeoFormFields, upsertSeoModule } from "@/lib/services/seo";
import { PostType } from "@/types";
import crypto from "crypto";

// Stessa convenzione di font/pairing/tag/collection: tutto il content
// management admin passa dal permesso ombrello "font:*", niente resource
// dedicata per ogni entità.
async function checkPermission(permission: string) {
  const session = await getServerAuthSession();
  const permissions = session?.user?.permissions || [];
  const roles = session?.user?.roles || [];
  const isSuperAdmin = roles.includes("SUPERADMIN") || roles.includes("ADMIN");

  if (!isSuperAdmin && !permissions.includes(permission)) {
    throw new Error("Unauthorized");
  }
  return session;
}

const AUTHOR_SELECT = {
  select: { id: true, name: true, surname: true, imageUrl: true },
} as const;

// La sezione admin resta "/admin/blog" (nome del content-type in CMS), ma la
// rotta pubblica dei post di tipo BLOG è "/pills", non "/blog".
function adminRouteBase(postType: PostType) {
  return postType === "BLOG" ? "blog" : "archive";
}

function publicRouteBase(postType: PostType) {
  return postType === "BLOG" ? "pills" : "archive";
}

function r2ImagesFolder(postType: PostType) {
  return postType === "BLOG" ? "blogPosts/images" : "archivePosts/images";
}

function r2InsightImagesFolder(postType: PostType) {
  return postType === "BLOG" ? "blogPosts/insights/images" : "archivePosts/insights/images";
}

function revalidatePostPaths(postType: PostType) {
  revalidatePath(`/admin/${adminRouteBase(postType)}`);
  revalidatePath(`/${publicRouteBase(postType)}`);
}

export async function getAdminPosts(postType: PostType) {
  await checkPermission("font:read");
  return withSafeDbQuery(() =>
    prisma.post.findMany({
      where: { postType },
      include: {
        author: AUTHOR_SELECT,
        tags: true,
        fonts: true,
      },
      orderBy: { createdAt: "desc" },
    })
  );
}

export async function getAdminPostById(id: string) {
  await checkPermission("font:read");
  return withSafeDbQuery(() =>
    prisma.post.findUnique({
      where: { id },
      include: {
        author: AUTHOR_SELECT,
        tags: true,
        fonts: { include: { variants: true } },
        seo: true,
      },
    })
  );
}

export async function deletePost(id: string) {
  await checkPermission("font:delete");

  const post = await prisma.post.findUnique({
    where: { id },
    select: { thumbnailUrl: true, imageUrl: true, postType: true },
  });

  if (post?.thumbnailUrl) {
    try {
      await deleteFromR2(post.thumbnailUrl);
    } catch (err) {
      console.warn("Failed to delete post thumbnail from R2:", err);
    }
  }
  if (post?.imageUrl) {
    try {
      await deleteFromR2(post.imageUrl);
    } catch (err) {
      console.warn("Failed to delete post image from R2:", err);
    }
  }

  await prisma.post.delete({ where: { id } });
  revalidatePostPaths((post?.postType as PostType) || "ARCHIVE");
}

async function setPostPublished(id: string, published: boolean) {
  await checkPermission("font:update");
  const post = await prisma.post.update({
    where: { id },
    data: { published },
    select: { postType: true },
  });
  revalidatePostPaths(post.postType as PostType);
}

export async function publishPost(id: string) {
  return setPostPublished(id, true);
}

export async function unpublishPost(id: string) {
  return setPostPublished(id, false);
}

export async function savePost(prevState: any, formData: FormData, postType: PostType, id?: string) {
  const session = await getServerAuthSession();
  if (!session?.user) return "Unauthorized";

  try {
    if (id) {
      await checkPermission("font:update");
    } else {
      await checkPermission("font:create");
    }

    const title = (formData.get("title") as string)?.trim();
    const slug = (formData.get("slug") as string)?.trim();
    const caption = (formData.get("caption") as string)?.trim() || null;
    const description = (formData.get("description") as string)?.trim() || null;
    const imageAlt = (formData.get("imageAlt") as string)?.trim() || null;
    const insight = (formData.get("insight") as string)?.trim() || null;
    const published = formData.get("published") === "true";
    const tagIds = formData.getAll("tagIds") as string[];
    const fontIds = formData.getAll("fontIds") as string[];
    const removeThumbnail = formData.get("removeThumbnail") === "true";
    const removeImage = formData.get("removeImage") === "true";

    const thumbnailFile = formData.get("thumbnail") as File | null;
    const imageFile = formData.get("image") as File | null;

    const seoData = parseSeoFormFields(formData);
    const removeOgImage = formData.get("removeOgImage") === "true";
    const removeTwitterImage = formData.get("removeTwitterImage") === "true";
    const ogImageFile = formData.get("ogImage") as File | null;
    const twitterImageFile = formData.get("twitterImage") as File | null;

    if (!title || !slug) {
      return "Title and Slug are required.";
    }

    // Check unique slug
    const existingSlug = await prisma.post.findFirst({
      where: {
        slug,
        NOT: id ? { id } : undefined,
      },
    });
    if (existingSlug) {
      return "A post with this slug already exists.";
    }

    let existingPost: {
      thumbnailUrl: string | null;
      imageUrl: string | null;
      insight: string | null;
      seo: { id: string; ogImageUrl: string | null; twitterImageUrl: string | null } | null;
    } | null = null;
    if (id) {
      existingPost = await prisma.post.findUnique({
        where: { id },
        select: {
          thumbnailUrl: true,
          imageUrl: true,
          insight: true,
          seo: { select: { id: true, ogImageUrl: true, twitterImageUrl: true } },
        },
      });
    }

    const postId = id || crypto.randomUUID();

    // Insight Modules Image Processing — PRIMA di scrivere su DB. I moduli che
    // portano un'immagine (paragraphWithImage, simpleHero, gridHero, actioncta)
    // arrivano con un base64 temporaneo in props.imageSrc (per l'anteprima
    // admin) e il file reale in un input nascosto `module_<id>_image`. Se lo
    // caricassimo dopo il primo create/update — come faceva la versione
    // precedente, ricalcata su pairing.ts — quel base64 finirebbe scritto
    // nella colonna `insight`, che su D1 ha un limite di dimensione per valore
    // (SQLITE_TOOBIG con hero image multiple, specialmente nel blog che offre
    // più tipi di modulo con immagine rispetto alle 3 storiche dell'archive).
    interface InsightModuleRecord {
      id: string;
      type: string;
      props: Record<string, unknown> & { imageSrc?: string };
    }
    const MODULE_TYPES_WITH_IMAGE = new Set(["paragraphWithImage", "simpleHero", "gridHero", "actioncta"]);
    let finalInsight = insight;
    try {
      const modules: InsightModuleRecord[] = insight ? JSON.parse(insight) : [];
      if (Array.isArray(modules)) {
        let oldModulesById: Record<string, InsightModuleRecord> = {};
        if (existingPost?.insight) {
          try {
            const oldModules: InsightModuleRecord[] = JSON.parse(existingPost.insight);
            if (Array.isArray(oldModules)) {
              oldModulesById = Object.fromEntries(oldModules.map((m) => [m.id, m]));
            }
          } catch {}
        }

        const insightImagesFolder = r2InsightImagesFolder(postType);

        for (let index = 0; index < modules.length; index++) {
          const mod = modules[index];
          if (!mod || !MODULE_TYPES_WITH_IMAGE.has(mod.type)) continue;

          const file = formData.get(`module_${mod.id}_image`) as File | null;
          const oldImageSrc = oldModulesById[mod.id]?.props?.imageSrc as string | undefined;

          if (file && file.size > 0) {
            try {
              const buffer = Buffer.from(await file.arrayBuffer());
              const ext = file.name.split(".").pop() || "png";
              const fileName = `${postId}-${Date.now()}-${index}.${ext}`;

              const { url } = await uploadToR2(buffer, insightImagesFolder, fileName, file.type || "image/png");
              mod.props.imageSrc = url;

              if (oldImageSrc && oldImageSrc.startsWith("http")) {
                try {
                  await deleteFromR2(oldImageSrc);
                } catch (cleanError) {
                  console.warn("Failed to delete previous insight module image from R2:", cleanError);
                }
              }
            } catch (uploadError) {
              console.error("Failed to upload insight module image to R2:", uploadError);
            }
          } else if (!mod.props?.imageSrc && oldImageSrc && oldImageSrc.startsWith("http")) {
            try {
              await deleteFromR2(oldImageSrc);
            } catch (cleanError) {
              console.warn("Failed to delete removed insight module image from R2:", cleanError);
            }
          } else if (typeof mod.props?.imageSrc === "string" && mod.props.imageSrc.startsWith("data:")) {
            // Nessun file nell'input nascosto ma imageSrc è ancora un base64
            // (stato client disallineato) — non va MAI scritto su D1: meglio
            // perdere l'immagine che far fallire l'intero salvataggio.
            mod.props.imageSrc = oldImageSrc && oldImageSrc.startsWith("http") ? oldImageSrc : "";
          }
        }

        finalInsight = JSON.stringify(modules);
      }
    } catch (insightError) {
      console.error("Failed to process insight modules images:", insightError);
    }

    const baseData = {
      title,
      slug,
      caption,
      description,
      imageAlt,
      insight: finalInsight,
      published,
    };

    let post;
    if (id) {
      post = await prisma.post.update({
        where: { id },
        data: {
          ...baseData,
          tags: { set: tagIds.map((tId) => ({ id: tId })) },
          fonts: { set: fontIds.map((fId) => ({ id: fId })) },
        },
      });
    } else {
      post = await prisma.post.create({
        data: {
          id: postId,
          postType,
          ...baseData,
          authorId: session.user.id,
          createdAt: new Date(),
          tags: { connect: tagIds.map((tId) => ({ id: tId })) },
          fonts: { connect: fontIds.map((fId) => ({ id: fId })) },
        },
      });
    }

    const imagesFolder = r2ImagesFolder(postType);

    // R2 image processing — thumbnail e immagine principale sono indipendenti,
    // stessa gestione atomica upload-poi-DB-poi-cleanup-vecchio-file di pairing.ts
    let uploadedKeys: string[] = [];
    // Traccia il thumbnail finale (post-eventuale upload/rimozione qui sotto):
    // serve come fallback per le immagini SEO se l'admin non ne assegna una sua.
    let finalThumbnailUrl: string | null = existingPost?.thumbnailUrl ?? null;
    let seoOgImageUrl: string | null = null;
    let seoTwitterImageUrl: string | null = null;
    try {
      if (removeThumbnail) {
        await prisma.post.update({ where: { id: post.id }, data: { thumbnailUrl: null } });
        finalThumbnailUrl = null;
        if (existingPost?.thumbnailUrl) {
          try {
            await deleteFromR2(existingPost.thumbnailUrl);
          } catch (cleanError) {
            console.warn("Failed to remove old post thumbnail from R2:", cleanError);
          }
        }
      } else if (thumbnailFile && thumbnailFile.size > 0) {
        const buffer = Buffer.from(await thumbnailFile.arrayBuffer());
        const ext = thumbnailFile.name.split(".").pop() || "png";
        const fileName = `${post.id}-thumb-${Date.now()}.${ext}`;
        const { url, key } = await uploadToR2(buffer, imagesFolder, fileName, thumbnailFile.type || "image/png");
        uploadedKeys.push(key);
        finalThumbnailUrl = url;

        await prisma.post.update({ where: { id: post.id }, data: { thumbnailUrl: url } });

        if (existingPost?.thumbnailUrl) {
          try {
            await deleteFromR2(existingPost.thumbnailUrl);
          } catch (cleanError) {
            console.warn("Failed to delete previous post thumbnail from R2:", cleanError);
          }
        }
      }

      if (removeImage) {
        await prisma.post.update({ where: { id: post.id }, data: { imageUrl: null } });
        if (existingPost?.imageUrl) {
          try {
            await deleteFromR2(existingPost.imageUrl);
          } catch (cleanError) {
            console.warn("Failed to remove old post image from R2:", cleanError);
          }
        }
      } else if (imageFile && imageFile.size > 0) {
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const ext = imageFile.name.split(".").pop() || "png";
        const fileName = `${post.id}-image-${Date.now()}.${ext}`;
        const { url, key } = await uploadToR2(buffer, imagesFolder, fileName, imageFile.type || "image/png");
        uploadedKeys.push(key);

        await prisma.post.update({ where: { id: post.id }, data: { imageUrl: url } });

        if (existingPost?.imageUrl) {
          try {
            await deleteFromR2(existingPost.imageUrl);
          } catch (cleanError) {
            console.warn("Failed to delete previous post image from R2:", cleanError);
          }
        }
      }

      // SEO images (OG / Twitter) — file diretto se caricato, altrimenti
      // fallback al thumbnail gestito subito dopo da upsertSeoModule.
      if (ogImageFile && ogImageFile.size > 0) {
        const buffer = Buffer.from(await ogImageFile.arrayBuffer());
        const ext = ogImageFile.name.split(".").pop() || "png";
        const fileName = `${post.id}-seo-og-${Date.now()}.${ext}`;
        const { url, key } = await uploadToR2(buffer, imagesFolder, fileName, ogImageFile.type || "image/png");
        uploadedKeys.push(key);
        seoOgImageUrl = url;

        if (existingPost?.seo?.ogImageUrl) {
          try {
            await deleteFromR2(existingPost.seo.ogImageUrl);
          } catch (cleanError) {
            console.warn("Failed to delete previous post OG image from R2:", cleanError);
          }
        }
      } else if (removeOgImage && existingPost?.seo?.ogImageUrl) {
        try {
          await deleteFromR2(existingPost.seo.ogImageUrl);
        } catch (cleanError) {
          console.warn("Failed to remove old post OG image from R2:", cleanError);
        }
      }

      if (twitterImageFile && twitterImageFile.size > 0) {
        const buffer = Buffer.from(await twitterImageFile.arrayBuffer());
        const ext = twitterImageFile.name.split(".").pop() || "png";
        const fileName = `${post.id}-seo-twitter-${Date.now()}.${ext}`;
        const { url, key } = await uploadToR2(buffer, imagesFolder, fileName, twitterImageFile.type || "image/png");
        uploadedKeys.push(key);
        seoTwitterImageUrl = url;

        if (existingPost?.seo?.twitterImageUrl) {
          try {
            await deleteFromR2(existingPost.seo.twitterImageUrl);
          } catch (cleanError) {
            console.warn("Failed to delete previous post Twitter image from R2:", cleanError);
          }
        }
      } else if (removeTwitterImage && existingPost?.seo?.twitterImageUrl) {
        try {
          await deleteFromR2(existingPost.seo.twitterImageUrl);
        } catch (cleanError) {
          console.warn("Failed to remove old post Twitter image from R2:", cleanError);
        }
      }

      const seoId = await upsertSeoModule(existingPost?.seo?.id, seoData, {
        fallbackImageUrl: finalThumbnailUrl,
        ogImageUrl: seoOgImageUrl,
        ogImageRemoved: removeOgImage,
        twitterImageUrl: seoTwitterImageUrl,
        twitterImageRemoved: removeTwitterImage,
      });
      if (!existingPost?.seo?.id) {
        await prisma.post.update({ where: { id: post.id }, data: { seoId } });
      }
    } catch (r2Error) {
      for (const key of uploadedKeys) {
        try {
          await deleteFromR2(key);
        } catch (cleanError) {
          console.error("Critical: failed to delete uploaded file from R2 after DB error:", cleanError);
        }
      }
      if (!id) {
        try {
          await prisma.post.delete({ where: { id: post.id } });
        } catch (dbDeleteError) {
          console.error("Critical: failed to roll back post creation after R2 upload error:", dbDeleteError);
        }
      }
      throw r2Error;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Post Action] Error saving post:", error);
    return errorMessage || "Failed to save post.";
  }

  // Niente redirect() qui — vedi il commento in lib/actions/font.ts: il
  // ritorno alla lista con pagina/filtri intatti lo fa PostForm via
  // router.back() lato client dopo un salvataggio riuscito.
  revalidatePostPaths(postType);
}
