"use client";

import { useState } from "react";
import Link from "next/link";
import type { WorkspaceSurfaceId } from "@/lib/workspace-truth";
import { ThemeToggle } from "@/components/ThemeToggle";

export type ShellTab = { id: WorkspaceSurfaceId; label: string };

type Props = {
  tabs: ShellTab[];
  activeTab: WorkspaceSurfaceId;
  onTabChange: (id: WorkspaceSurfaceId) => void;
  workspaceName: string;
  tierLabel: string;
  usageLabel?: string;
  usageLow?: boolean;
  onLogout: () => void;
  children: React.ReactNode;
};

/** Workspace app chrome: a quiet left rail on desktop, a top bar with a sheet on mobile. */
export function WorkspaceShell({ tabs, activeTab, onTabChange, workspaceName, tierLabel, usageLabel, usageLow, onLogout, children }: Props) {
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3" aria-label="Workspace">
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => { onTabChange(tab.id); setOpen(false); }}
            aria-current={active ? "page" : undefined}
            className={`flex h-9 items-center rounded-[8px] px-3 text-left text-[13.5px] transition-colors ${
              active
                ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-[inset_2px_0_0_var(--accent)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
      <div className="my-3 h-px bg-[var(--border-subtle)]" />
      <Link href="/docs" className="flex h-9 items-center rounded-[8px] px-3 text-[13.5px] text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]">Docs</Link>
      <a href="mailto:hello@apiclaw.cloud?subject=APIClaw%20feedback" className="flex h-9 items-center rounded-[8px] px-3 text-[13.5px] text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]">Feedback</a>
    </nav>
  );

  const identity = (
    <div className="border-t border-[var(--border-subtle)] px-4 py-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] text-[var(--text-primary)]">{workspaceName}</p>
          <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">
            <span className="capitalize">{tierLabel}</span>
            {usageLabel && <span> · <span className={usageLow ? "text-[var(--accent)]" : ""}>{usageLabel}</span></span>}
          </p>
        </div>
        <ThemeToggle className="!h-8 !w-8 shrink-0" />
      </div>
      <button type="button" onClick={onLogout} className="mt-2 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)]">Sign out</button>
    </div>
  );

  return (
    <div className="claw min-h-screen">
      {/* Mobile bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--background)]/90 px-4 backdrop-blur-md lg:hidden">
        <Link href="/" className="flex items-center gap-2.5" aria-label="APIClaw home">
          <span className="text-[18px] leading-none" aria-hidden="true">🦞</span>
          <span className="text-[14px] font-semibold tracking-tight">APIClaw</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="workspace-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md text-[var(--text-secondary)]"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            {open ? <path d="M3 3l12 12M15 3L3 15" /> : <path d="M2 5h14M2 9h14M2 13h14" />}
          </svg>
        </button>
      </header>
      {open && (
        <div id="workspace-nav" className="border-b border-[var(--border-subtle)] bg-[var(--background)] lg:hidden">
          {nav}
          {identity}
        </div>
      )}

      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 hidden w-[232px] flex-col border-r border-[var(--border-subtle)] bg-[var(--background)] lg:flex">
        <Link href="/" className="flex h-14 items-center gap-2.5 px-5" aria-label="APIClaw home">
          <span className="text-[18px] leading-none" aria-hidden="true">🦞</span>
          <span className="text-[14px] font-semibold tracking-tight">APIClaw</span>
        </Link>
        {nav}
        {identity}
      </aside>

      <main className="min-h-screen lg:pl-[232px]">
        <div className="mx-auto w-full max-w-[1080px] px-5 py-8 sm:px-8 sm:py-10">{children}</div>
      </main>
    </div>
  );
}
