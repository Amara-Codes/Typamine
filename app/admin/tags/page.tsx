import { getServerAuthSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { hasPermission, protectPage } from "@/lib/rbac";
import TabHeading from "@/components/admin/common/TabHeading";
import TagListClient from "@/components/admin/tags/TagListClient";
import { withSafeDbQuery } from "@/lib/services/dbMigration";

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
  const sort = resolvedParams.sort || "name_asc";
  const search = resolvedParams.search || "";

  const canCreate = hasPermission(session, "font", "create");
  const canUpdate = hasPermission(session, "font", "update");
  const canDelete = hasPermission(session, "font", "delete");

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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
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
