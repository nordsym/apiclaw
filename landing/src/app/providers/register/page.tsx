"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProviderRegisterRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/workspace?tab=my-apis"); }, [router]);
  return null;
}
