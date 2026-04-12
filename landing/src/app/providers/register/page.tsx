import { redirect } from "next/navigation";

export default function RegisterPage() {
  redirect("/workspace?tab=my-apis");
}
