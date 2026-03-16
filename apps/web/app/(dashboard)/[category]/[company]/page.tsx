import { redirect } from "next/navigation";

export default function OldCompanyPage({ params }: { params: { category: string; company: string } }) {
  redirect(`/dashboard/${params.category}/${params.company}`);
}
