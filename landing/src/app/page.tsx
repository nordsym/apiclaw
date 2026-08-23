"use client";

import { useEffect, useState } from "react";
import { getWorkspaceSessionToken } from "@/lib/workspace-session";
import { SiteHeader } from "@/components/home/SiteHeader";
import { Hero } from "@/components/home/Hero";
import { Connect } from "@/components/home/Connect";
import { Loop } from "@/components/home/Loop";
import { Proof } from "@/components/home/Proof";
import { Owners } from "@/components/home/Owners";
import { Faq } from "@/components/home/Faq";
import { SiteFooter } from "@/components/home/SiteFooter";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Resolve the workspace from the HttpOnly cookie, never a persisted bearer.
    void getWorkspaceSessionToken().then((token) => setIsLoggedIn(Boolean(token)));
  }, []);

  return (
    <main className="claw min-h-screen overflow-x-hidden">
      <SiteHeader />
      <Hero />
      <Connect />
      <Loop />
      <Proof isLoggedIn={isLoggedIn} />
      <Owners />
      <Faq />
      <SiteFooter />
    </main>
  );
}
