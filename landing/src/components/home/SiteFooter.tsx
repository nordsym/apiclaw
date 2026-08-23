const LINKS = [
  { href: "/SKILL.md", label: "SKILL.md" },
  { href: "/docs", label: "Docs" },
  { href: "/catalog", label: "Catalog" },
  { href: "/security", label: "Security" },
  { href: "https://github.com/nordsym/apiclaw", label: "GitHub", external: true },
  { href: "mailto:support_apiclaw@nordsym.com", label: "Support" },
];

export function SiteFooter() {
  return (
    <footer>
      <div className="claw-container">
        <div className="claw-rule" />
        <div className="flex flex-col gap-5 py-10 text-[13px] text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true">🦞</span> © 2026 NordSym AB
          </span>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="claw-link" {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
