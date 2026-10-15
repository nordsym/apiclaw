import { ThemeToggle } from "@/components/ThemeToggle";

export function SiteHeader({
  signInHref = "/sign-in",
}: {
  /** Omit or pass a path. `null` hides the header Sign in (CLI Authorize). */
  signInHref?: string | null;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-background/85 backdrop-blur-md">
      <div className="claw-container flex h-14 items-center justify-between">
        <a href="/" className="flex items-center gap-2.5" aria-label="APIClaw home">
          <span className="text-[20px] leading-none" aria-hidden="true">🦞</span>
          <span className="text-[15px] font-semibold tracking-tight">APIClaw</span>
        </a>
        <nav className="flex items-center gap-3 sm:gap-5 text-[13.5px]" aria-label="Primary">
          <a href="/pricing" className="claw-link hidden sm:inline">Pricing</a>
          <a href="/docs" className="claw-link">Docs</a>
          <a href="/catalog" className="claw-link hidden md:inline">Catalog</a>
          <span className="hidden sm:inline-flex"><ThemeToggle /></span>
          {signInHref ? (
            <><a href={signInHref} className="claw-link">{signInHref === "/workspace" ? "Workspace" : "Log in"}</a>
            {signInHref !== "/workspace" && <a href="/sign-up" className="claw-btn claw-btn-quiet !h-9 !px-3.5 !text-[13px]">Sign up</a>}</>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
