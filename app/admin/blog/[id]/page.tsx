import { notFound } from "next/navigation";
import PostForm from "@/components/admin/post/PostForm";
import { getAdminPostById } from "@/lib/actions/post";
import { getFonts } from "@/lib/actions/font";
import { getAdminTags } from "@/lib/actions/tag";
import TabHeading from "@/components/admin/common/TabHeading";

export const dynamic = "force-dynamic";

interface EditBlogPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { id } = await params;

  const [post, fonts, tags] = await Promise.all([
    getAdminPostById(id),
    getFonts(),
    getAdminTags(),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <TabHeading
        title="Edit Blog Post"
        showButton={false}
      />
      <PostForm postType="BLOG" initialData={post} fonts={fonts} tags={tags} />
    </div>
  );
}
