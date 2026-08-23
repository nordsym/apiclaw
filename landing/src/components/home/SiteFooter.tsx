const COLS = [
  {
    title: "Product",
    links: [
      { href: "/SKILL.md", label: "SKILL.md" },
      { href: "/install", label: "Install" },
      { href: "/catalog", label: "Catalog" },
      { href: "/docs", label: "Docs" },
      { href: "/sign-in", label: "Sign in" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "#faq", label: "FAQ" },
      { href: "/security", label: "Security" },
      { href: "/llms.txt", label: "llms.txt" },
      { href: "/docs#list-your-api", label: "List your API" },
    ],
  },
  {
    title: "Connect",
    links: [
      { href: "https://github.com/nordsym/apiclaw", label: "GitHub", external: true },
      { href: "https://x.com/APIClaw", label: "X", external: true },
      { href: "mailto:support_apiclaw@nordsym.com", label: "Support" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer>
      <div className="claw-container">
        <div className="claw-rule" />
        <div className="grid gap-10 py-14 sm:grid-cols-[1.4fr_1fr_1fr_1fr] sm:py-16">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-[18px] leading-none" aria-hidden="true">🦞</span>
              <span className="text-[14px] font-semibold tracking-tight">APIClaw</span>
            </div>
            <p className="mt-3 max-w-[18rem] text-[13.5px] leading-[1.6] text-text-muted">
              Authenticated discovery and execution for AI agents. Built by NordSym.
            </p>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <h4 className="claw-eyebrow mb-4 !text-[11px]">{c.title}</h4>
              <ul className="space-y-2.5 text-[13.5px]">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="claw-link"
                      {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border-subtle py-6 text-[12.5px] text-text-muted">
          <span>© 2026 NordSym AB</span>
          <a href="/api/health" className="claw-link">Status</a>
        </div>
      </div>
    </footer>
  );
}
