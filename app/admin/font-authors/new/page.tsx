import FontAuthorForm from "@/components/admin/fontAuthors/FontAuthorForm";
import TabHeading from "@/components/admin/common/TabHeading";

export const dynamic = "force-dynamic";

export default async function NewFontAuthorPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <TabHeading title="New Font Author" showButton={false} />
      <FontAuthorForm />
    </div>
  );
}
