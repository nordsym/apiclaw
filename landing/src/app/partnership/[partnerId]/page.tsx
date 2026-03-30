import { redirect } from "next/navigation";

export default function PartnershipPage({
  params,
}: {
  params: { partnerId: string };
}) {
  redirect(`/mou/${params.partnerId}`);
}
