import { redirect } from "next/navigation";

export default function OldCategoryPage({ params }: { params: { category: string } }) {
  redirect(`/dashboard/${params.category}`);
}
