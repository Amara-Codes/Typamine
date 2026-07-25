import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/services/post";
import ArchivePostDetailClient from "./ArchivePostDetailClient";

interface ArchivePostDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArchivePostDetailPage({ params }: ArchivePostDetailPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return <ArchivePostDetailClient post={post} />;
}
