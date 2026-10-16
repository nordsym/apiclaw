"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Clerk owns the OAuth flow. Keep its form, and make the redirect visible. */
export function AuthProgress({ children }: { children: ReactNode }) {
  const [openingGoogle, setOpeningGoogle] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return <div aria-busy={openingGoogle} onClickCapture={(event) => {
    const button = (event.target as HTMLElement).closest("button");
    if (!button || !/google/i.test(button.textContent ?? button.getAttribute("aria-label") ?? "")) return;
    if (openingGoogle) { event.preventDefault(); event.stopPropagation(); return; }
    setOpeningGoogle(true);
    // Return control if a popup is blocked or Clerk rejects the redirect.
    timer.current = setTimeout(() => setOpeningGoogle(false), 15_000);
  }}>
    {children}
    {openingGoogle && <p role="status" className="mt-4 text-center text-sm text-text-secondary">Opening Google sign-in…</p>}
  </div>;
}
