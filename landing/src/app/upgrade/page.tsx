import { redirect } from "next/navigation";

export default function UpgradePage() {
  redirect("/workspace?tab=billing");
}
