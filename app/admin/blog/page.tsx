import { getServerAuthSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { hasPermission, protectPage } from "@/lib/rbac";
import TabHeading from "@/components/admin/common/TabHeading";
import PostListClient from "@/components/admin/post/PostListClient";
import { withSafeDbQuery } from "@/lib/services/dbMigration";

export const dynamic = "force-dynamic";

interface BlogPostListPageProps {
  searchParams: Promise<{
    page?: string;
    perPage?: string;
    sort?: string;
    search?: string;
  }>;
}

export default async function BlogPostListPage(props: BlogPostListPageProps) {
  const session = await getServerAuthSession();
  await protectPage(session, "font");

  const resolvedParams = await props.searchParams;

  const page = parseInt(resolvedParams.page || "1", 10);
  const perPage = parseInt(resolvedParams.perPage || "10", 10);
  const sort = resolvedParams.sort || "createdAt_desc";
  const search = resolvedParams.search || "";

  const canCreate = hasPermission(session, "font", "create");
  const canUpdate = hasPermission(session, "font", "update");
  const canDelete = hasPermission(session, "font", "delete");

  const where: any = { postType: "BLOG" };
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { slug: { contains: search } },
      { caption: { contains: search } },
      { description: { contains: search } },
    ];
  }

  let orderBy: any = {};
  if (sort === "name_asc") {
    orderBy = { title: "asc" };
  } else if (sort === "name_desc") {
    orderBy = { title: "desc" };
  } else if (sort === "createdAt_desc") {
    orderBy = { createdAt: "desc" };
  } else if (sort === "createdAt_asc") {
    orderBy = { createdAt: "asc" };
  } else {
    orderBy = { createdAt: "desc" };
  }

  const totalCount = await withSafeDbQuery(() => prisma.post.count({ where }));
  const posts = await withSafeDbQuery(() =>
    prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, surname: true } },
        tags: true,
      },
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    })
  );

  return (
    <div className="space-y-10">
      <TabHeading
        title="Blog Posts"
        buttonHref="/admin/blog/new"
        buttonLabel="Add Post"
        showButton={canCreate}
      />

      <PostListClient
        postType="BLOG"
        posts={posts}
        totalCount={totalCount}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  );
}
