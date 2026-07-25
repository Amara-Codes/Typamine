import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/services/post";
import PillDetailClient from "./PillDetailClient";

interface PillDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PillDetailPage({ params }: PillDetailPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return <PillDetailClient post={post} />;
}
