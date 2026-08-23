"use client";

import { useState } from "react";

const NAV = [
  { href: "/catalog", label: "Catalog" },
  { href: "/docs", label: "Docs" },
  { href: "#pricing", label: "Pricing" },
  { href: "#api-owners", label: "API owners" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-background/85 backdrop-blur-md">
      <div className="claw-container flex h-14 items-center justify-between">
        <a href="/" className="flex items-center gap-2.5" aria-label="APIClaw home">
          <span className="text-[20px] leading-none" aria-hidden="true">🦞</span>
          <span className="text-[15px] font-semibold tracking-tight">APIClaw</span>
        </a>

        <nav className="hidden md:flex items-center gap-7 text-[13.5px]" aria-label="Primary">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="claw-link">{n.label}</a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-5">
          <a href="/sign-in" className="claw-link text-[13.5px]">Sign in</a>
          <a href="#connect" className="claw-btn claw-btn-solid !h-9 !px-3.5 !text-[13px]">Add to your agent</a>
        </div>

        <button
          type="button"
          className="md:hidden -mr-2 flex h-10 w-10 items-center justify-center rounded-md text-text-secondary"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            {open ? (
              <path d="M3 3l12 12M15 3L3 15" />
            ) : (
              <path d="M2 5h14M2 9h14M2 13h14" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" className="md:hidden border-t border-border-subtle bg-background" aria-label="Primary mobile">
          <div className="claw-container flex flex-col py-2">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="py-3 text-[15px] text-text-primary">{n.label}</a>
            ))}
            <a href="/sign-in" onClick={() => setOpen(false)} className="py-3 text-[15px] text-text-primary">Sign in</a>
            <a href="#connect" onClick={() => setOpen(false)} className="claw-btn claw-btn-solid my-3">Add to your agent</a>
          </div>
        </nav>
      )}
    </header>
  );
}
