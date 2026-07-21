import { getServerAuthSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { FolderDown } from "lucide-react";
import { hasPermission, protectPage } from "@/lib/rbac";
import TabHeading from "@/components/admin/common/TabHeading";
import { Button } from "@/components/common/Button";
import FontListClient from "@/components/admin/fonts/FontListClient";
import { withCreatedAtBackfill } from "@/lib/services/font";

interface FontListPageProps {
  searchParams: Promise<{
    page?: string;
    perPage?: string;
    sort?: string;
    search?: string;
  }>;
}

export default async function FontListPage(props: FontListPageProps) {
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

  // Build filter query for database search
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { formula: { contains: search } },
      { category: { contains: search } },
      { creator: { contains: search } },
    ];
  }

  // Build database sort order
  let orderBy: any = {};
  if (sort === "name_asc") {
    orderBy = { name: "asc" };
  } else if (sort === "name_desc") {
    orderBy = { name: "desc" };
  } else if (sort === "variants_desc") {
    orderBy = { variants: { _count: "desc" } };
  } else if (sort === "variants_asc") {
    orderBy = { variants: { _count: "asc" } };
  } else if (sort === "createdAt_desc") {
    orderBy = { createdAt: "desc" };
  } else if (sort === "createdAt_asc") {
    orderBy = { createdAt: "asc" };
  } else {
    orderBy = { name: "asc" };
  }

  // Execute database pagination & total counts
  const totalCount = await prisma.ingredient.count({ where });
  const fonts = await withCreatedAtBackfill(() =>
    prisma.ingredient.findMany({
      where,
      include: {
        variants: true,
      },
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    })
  );

  return (
    <div className="space-y-10">
      <TabHeading
        title="Fonts"
        subtitle="Manage all the typographic elements"
        buttonHref="/admin/fonts/new"
        buttonLabel="Add Font"
        showButton={canCreate}
        extraButtonsPosition="left"
        extraButtons={
          canCreate && (
            <Link href="/admin/fonts/bulk-upload">
              <Button
                variant="outline"
                size="lg"
                roundness="md"
                className="flex items-center gap-2"
              >
                <FolderDown className="h-4 w-4" />
                Bulk Upload
              </Button>
            </Link>
          )
        }
      />

      <FontListClient
        fonts={fonts}
        totalCount={totalCount}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </div>
  );
}
