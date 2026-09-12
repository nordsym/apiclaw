import { redirect } from "next/navigation";

export default function ApiPage({ params }: { params: { apiId: string } }) {
  redirect(`/workspace?tab=provider-console&api=${encodeURIComponent(params.apiId)}`);
}
