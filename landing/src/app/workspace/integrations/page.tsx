// /workspace/integrations: retired (2026-08-24). Connected clients + generate-a-connector
// moved into the Agents view's "Connect an agent" section as a collapsed Connectors
// accordion. This route now only redirects old bookmarks so they don't 404, and so it
// stops matching the Settings nav item.
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function IntegrationsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/workspace?tab=agents");
  }, [router]);
  return null;
}
