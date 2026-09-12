import { redirect } from "next/navigation";

export default function ActionsPage({ params }: { params: { apiId: string } }) {
  redirect(`/workspace?tab=provider-console&api=${encodeURIComponent(params.apiId)}`);
}
