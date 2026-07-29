import { getServerAuthSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { hasPermission, protectPage } from "@/lib/rbac";
import TabHeading from "@/components/admin/common/TabHeading";
import FontAuthorListClient from "@/components/admin/fontAuthors/FontAuthorListClient";
import { withSafeDbQuery } from "@/lib/services/dbMigration";

export const dynamic = "force-dynamic";

interface FontAuthorListPageProps {
  searchParams: Promise<{
    page?: string;
    perPage?: string;
    sort?: string;
    search?: string;
  }>;
}

export default async function FontAuthorListPage(props: FontAuthorListPageProps) {
  const session = await getServerAuthSession();
  await protectPage(session, "fontAuthor");

  const resolvedParams = await props.searchParams;

  const page = parseInt(resolvedParams.page || "1", 10);
  const perPage = parseInt(resolvedParams.perPage || "10", 10);
  // Deve combaciare col primo elemento di sortOptions in FontAuthorListClient.
  const sort = resolvedParams.sort || "name_asc";
  const search = resolvedParams.search || "";

  const canCreate = hasPermission(session, "fontAuthor", "create");
  const canUpdate = hasPermission(session, "fontAuthor", "update");
  const canDelete = hasPermission(session, "fontAuthor", "delete");

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { slug: { contains: search } },
    ];
  }

  let orderBy: any = {};
  if (sort === "name_desc") {
    orderBy = { name: "desc" };
  } else if (sort === "createdAt_desc") {
    orderBy = { createdAt: "desc" };
  } else if (sort === "createdAt_asc") {
    orderBy = { createdAt: "asc" };
  } else {
    orderBy = { name: "asc" };
  }

  const totalCount = await withSafeDbQuery(() => prisma.fontAuthor.count({ where }));
  const authors = await withSafeDbQuery(() =>
    prisma.fontAuthor.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    })
  );

  return (
    <div className="space-y-10">
      <TabHeading
        title="Font Authors"
        showButton={canCreate}
        buttonHref="/admin/font-authors/new"
        buttonLabel="New Font Author"
      />
      <FontAuthorListClient authors={authors} totalCount={totalCount} canUpdate={canUpdate} canDelete={canDelete} />
    </div>
  );
}
