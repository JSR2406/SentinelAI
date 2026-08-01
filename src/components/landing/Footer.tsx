const groups = [
  { title: "Product", links: ["Secret Detection", "AI Security", "Attack Graph", "Cloud Security"] },
  { title: "Company", links: ["About", "Careers", "Security", "Contact"] },
  { title: "Resources", links: ["Docs", "Changelog", "Status", "Trust Center"] },
];

export function Footer() {
  return (
    <footer id="docs" className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-brand">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="oklch(0.14 0.015 260)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
              </svg>
            </span>
            <span className="font-display text-[17px] font-semibold">SentinelAI</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            AI security copilot for modern developers. Scan code, APIs, cloud and AI apps before
            hackers do.
          </p>
        </div>
        {groups.map((g) => (
          <div key={g.title}>
            <h3 className="text-sm font-semibold">{g.title}</h3>
            <ul className="mt-4 space-y-3">
              {g.links.map((l) => (
                <li key={l}>
                  <a
                    href="#product"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-2 border-t border-border px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} SentinelAI, Inc. All rights reserved.</p>
        <p>SOC 2 Type II · ISO 27001</p>
      </div>
    </footer>
  );
}