import { redirect } from "next/navigation";

export default async function OldCompanyPage({ params }: { params: Promise<{ category: string; company: string }> }) {
  const { category, company } = await params;
  redirect(`/dashboard/${category}/${company}`);
}
