import { notFound } from "next/navigation";
import { getFontAuthorBySlug } from "@/lib/services/fontAuthor";
import { getIngredientsByAuthorId } from "@/lib/services/font";
import AuthorDetailClient from "./AuthorDetailClient";

interface AuthorDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AuthorDetailPage({ params }: AuthorDetailPageProps) {
  const { slug } = await params;
  const author = await getFontAuthorBySlug(slug);

  if (!author) {
    notFound();
  }

  const fonts = await getIngredientsByAuthorId(author.id);

  return <AuthorDetailClient author={author} fonts={fonts} />;
}
