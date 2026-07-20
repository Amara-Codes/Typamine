import { getServerAuthSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { hasPermission, protectPage } from "@/lib/rbac";
import TabHeading from "@/components/admin/common/TabHeading";
import PairingListClient from "@/components/admin/pairings/PairingListClient";
import { withSafeDbQuery } from "@/lib/services/dbMigration";

export const dynamic = "force-dynamic";

interface PairingListPageProps {
  searchParams: Promise<{
    page?: string;
    perPage?: string;
    sort?: string;
    search?: string;
  }>;
}

export default async function PairingListPage(props: PairingListPageProps) {
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

  // Build filter query
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { slug: { contains: search } },
      { description: { contains: search } },
      { primaryFont: { name: { contains: search } } },
      { secondaryFont: { name: { contains: search } } },
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
    orderBy = { createdAt: "desc" };
  }

  // Execute database pagination & total counts with D1 safe queries
  const totalCount = await withSafeDbQuery(() => prisma.prescription.count({ where }));
  const pairings = await withSafeDbQuery(() =>
    prisma.prescription.findMany({
      where,
      include: {
        primaryFont: true,
        secondaryFont: true,
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
        title="Typography Pairings"
        subtitle="Manage and publish font pairings"
        buttonHref="/admin/pairings/new"
        buttonLabel="Add Pairing"
        showButton={canCreate}
      />

      <PairingListClient
        pairings={pairings}
        totalCount={totalCount}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  );
}
