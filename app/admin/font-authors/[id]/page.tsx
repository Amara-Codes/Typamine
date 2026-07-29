import { notFound } from "next/navigation";
import FontAuthorForm from "@/components/admin/fontAuthors/FontAuthorForm";
import { getAdminFontAuthorById } from "@/lib/actions/fontAuthor";
import TabHeading from "@/components/admin/common/TabHeading";

export const dynamic = "force-dynamic";

interface EditFontAuthorPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFontAuthorPage({ params }: EditFontAuthorPageProps) {
  const { id } = await params;

  const author = await getAdminFontAuthorById(id);

  if (!author) {
    notFound();
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <TabHeading title="Edit Font Author" showButton={false} />
      <FontAuthorForm initialData={author} />
    </div>
  );
}
