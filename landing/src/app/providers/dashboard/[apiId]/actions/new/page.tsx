import { redirect } from "next/navigation";

export default function NewActionPage({ params }: { params: { apiId: string } }) {
  redirect(`/workspace?tab=provider-console&api=${encodeURIComponent(params.apiId)}`);
}
