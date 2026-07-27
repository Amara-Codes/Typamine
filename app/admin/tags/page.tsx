import { getServerAuthSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { hasPermission, protectPage } from "@/lib/rbac";
import TabHeading from "@/components/admin/common/TabHeading";
import TagListClient from "@/components/admin/tags/TagListClient";
import { Button } from "@/components/common/Button";
import { withSafeDbQuery } from "@/lib/services/dbMigration";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface TagListPageProps {
  searchParams: Promise<{
    page?: string;
    perPage?: string;
    sort?: string;
    search?: string;
  }>;
}

export default async function TagListPage(props: TagListPageProps) {
  const session = await getServerAuthSession();
  await protectPage(session, "font");

  const resolvedParams = await props.searchParams;

  const page = parseInt(resolvedParams.page || "1", 10);
  const perPage = parseInt(resolvedParams.perPage || "10", 10);
  // Deve combaciare col primo elemento di sortOptions in TagListClient
  // ("Newest Created" / createdAt_desc) — altrimenti la select mostra un
  // default diverso da quello che il fetch usa davvero in assenza di ?sort.
  const sort = resolvedParams.sort || "createdAt_desc";
  const search = resolvedParams.search || "";

  const canCreate = hasPermission(session, "tag", "create");
  const canUpdate = hasPermission(session, "tag", "update");
  const canDelete = hasPermission(session, "tag", "delete");

  // Build filter query
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  // Build database sort order
  let orderBy: any = {};
  if (sort === "name_asc") {
    orderBy = { name: "asc" };
  } else if (sort === "name_desc") {
    orderBy = { name: "desc" };
  } else if (sort === "createdAt_desc") {
    orderBy = { createdAt: "desc" };
  } else if (sort === "createdAt_asc") {
    orderBy = { createdAt: "asc" };
  } else {
    orderBy = { name: "asc" };
  }

  // Execute database pagination & total counts with D1 safe queries
  const totalCount = await withSafeDbQuery(() => prisma.tag.count({ where }));
  const tags = await withSafeDbQuery(() =>
    prisma.tag.findMany({
      where,
      include: {
        _count: {
          select: { prescriptions: true },
        },
      },
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    })
  );

  return (
    <div className="space-y-10">
       <TabHeading
        title="Tags"
        showButton={false}
      />
      <TagListClient
        tags={tags}
        totalCount={totalCount}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  );
}
