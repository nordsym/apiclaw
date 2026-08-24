"use client";

import type { ElementType, ReactNode } from "react";

/* ------------------------------------------------------------------
   Workspace UI primitives. Same system as the public site: typography
   first, hairlines over borders, one elevated surface per section,
   red only as a signature. Keep these the only building blocks.
   ------------------------------------------------------------------ */

/** Page title row: title, one-line description, optional action on the right. */
export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[1.6rem] font-semibold tracking-[-0.03em] leading-[1.15]">{title}</h1>
        {description && <p className="mt-1.5 text-[14px] text-[var(--text-secondary)]">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

/** Section inside a page: heading, optional description, content. Hairline on top. */
export function Section({ title, description, action, children, className = "" }: { title?: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`border-t border-[var(--border-subtle)] pt-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>}
            {description && <p className="mt-1 text-[13px] text-[var(--text-muted)]">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** The one elevated surface. Use sparingly: forms, a highlighted next action, a code sample. */
export function Panel({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const interactive = onClick ? "cursor-pointer transition-colors hover:border-[var(--border)] hover:bg-[var(--surface-elevated)]" : "";
  return (
    <div onClick={onClick} className={`rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface)] ${interactive} ${className}`}>
      {children}
    </div>
  );
}

/** Segmented control for sub-views. `icon` is accepted for compatibility and ignored. */
export function SurfaceTabs({ items, active, onChange, label = "View" }: {
  items: Array<{ id: string; label: string; icon?: ElementType }>;
  active: string;
  onChange: (id: string) => void;
  label?: string;
}) {
  return (
    <div className="claw-segments w-max" role="tablist" aria-label={label}>
      {items.map((item) => (
        <button key={item.id} type="button" role="tab" aria-selected={active === item.id} onClick={() => onChange(item.id)} className="claw-segment">
          {item.label}
        </button>
      ))}
    </div>
  );
}

/** Stat as a hairline cell: big number, small label. `icon`/`accent` kept for compatibility. */
export function StatCard({ title, value, change, hint }: { title: string; value: string; change?: number; hint?: string; icon?: ElementType; accent?: boolean }) {
  return (
    <div className="border-t border-[var(--border-subtle)] pt-3">
      <div className="claw-display text-[1.6rem] sm:text-[1.9rem]">{value}</div>
      <div className="mt-0.5 flex items-baseline gap-2 text-[13px]">
        <span className="text-[var(--text-secondary)]">{title}</span>
        {change !== undefined && (
          <span className={change >= 0 ? "text-[var(--ok)]" : "text-[var(--accent)]"}>{change >= 0 ? "+" : ""}{change.toFixed(1)}%</span>
        )}
      </div>
      {hint && <p className="mt-1 text-[12px] text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}

/** Grid for StatCards. */
export function StatGrid({ children, cols = 3 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const c = cols === 2 ? "sm:grid-cols-2" : cols === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3";
  return <div className={`grid gap-6 ${c}`}>{children}</div>;
}

/** List row: hairline separated, content left, meta/actions right. */
export function Row({ children, right, onClick, href }: { children: ReactNode; right?: ReactNode; onClick?: () => void; href?: string }) {
  const inner = (
    <>
      <div className="min-w-0 flex-1">{children}</div>
      {right && <div className="flex shrink-0 items-center gap-3 text-[13px] text-[var(--text-muted)]">{right}</div>}
    </>
  );
  const cls = "flex items-center gap-4 border-t border-[var(--border-subtle)] py-3.5 text-left";
  if (href) return <a href={href} className={`${cls} hover:bg-[var(--surface)] -mx-2 px-2 rounded-[8px]`}>{inner}</a>;
  if (onClick) return <button type="button" onClick={onClick} className={`${cls} w-full hover:bg-[var(--surface)] -mx-2 px-2 rounded-[8px]`}>{inner}</button>;
  return <div className={cls}>{inner}</div>;
}

/** Small status word. Never a pill with a tinted background. */
export function Status({ kind, children }: { kind: "ok" | "warn" | "bad" | "muted"; children: ReactNode }) {
  const color = kind === "ok" ? "text-[var(--ok)]" : kind === "warn" ? "text-[#e5b454]" : kind === "bad" ? "text-[var(--accent)]" : "text-[var(--text-muted)]";
  return <span className={`inline-flex items-center gap-1.5 text-[12.5px] ${color}`}><span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />{children}</span>;
}

/** Empty state: one line, one action. */
export function Empty({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="border-t border-[var(--border-subtle)] py-12 text-center">
      <p className="text-[15px] font-medium">{title}</p>
      {body && <p className="mx-auto mt-1.5 max-w-[28rem] text-[13.5px] text-[var(--text-muted)]">{body}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/** Inline loading line. */
export function Loading({ label = "Loading" }: { label?: string }) {
  return <p className="py-8 text-center text-[13px] text-[var(--text-muted)]">{label}…</p>;
}

/** Key/value pair for detail views. */
export function KV({ k, v, mono }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-t border-[var(--border-subtle)] py-2.5 text-[13.5px]">
      <span className="text-[var(--text-muted)]">{k}</span>
      <span className={`min-w-0 truncate text-right text-[var(--text-primary)] ${mono ? "claw-mono text-[12.5px]" : ""}`}>{v}</span>
    </div>
  );
}

/** Form field wrapper. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] text-[var(--text-muted)]">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[12px] text-[var(--text-muted)]">{hint}</span>}
    </label>
  );
}

export const inputClass = "h-10 w-full rounded-[10px] border border-[var(--border)] bg-[var(--background)] px-3 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--text-muted)] focus:outline-none disabled:opacity-60";
export const textareaClass = "w-full rounded-[10px] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--text-muted)] focus:outline-none";
export const btnSolid = "claw-btn claw-btn-solid !h-9 !px-3.5 !text-[13px]";
export const btnQuiet = "claw-btn claw-btn-quiet !h-9 !px-3.5 !text-[13px]";
export const btnDanger = "claw-btn !h-9 !px-3.5 !text-[13px] border-[var(--border)] text-[var(--accent)] hover:bg-[var(--surface)]";
