export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-background/85 backdrop-blur-md">
      <div className="claw-container flex h-14 items-center justify-between">
        <a href="/" className="flex items-center gap-2.5" aria-label="APIClaw home">
          <span className="text-[20px] leading-none" aria-hidden="true">🦞</span>
          <span className="text-[15px] font-semibold tracking-tight">APIClaw</span>
        </a>
        <nav className="flex items-center gap-5 text-[13.5px]" aria-label="Primary">
          <a href="/docs" className="claw-link">Docs</a>
          <a href="/catalog" className="claw-link hidden sm:inline">Catalog</a>
          <a href="/sign-in" className="claw-btn claw-btn-quiet !h-9 !px-3.5 !text-[13px]">Sign in</a>
        </nav>
      </div>
    </header>
  );
}
