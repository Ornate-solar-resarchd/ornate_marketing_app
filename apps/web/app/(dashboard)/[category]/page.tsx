import { redirect } from "next/navigation";

export default async function OldCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  redirect(`/dashboard/${category}`);
}
