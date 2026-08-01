import { useActiveSection } from "@/hooks/useActiveSection";

const links = [
  { label: "Product", id: "product" },
  { label: "Security", id: "security" },
  { label: "Pricing", id: "pricing" },
];

const ids = links.map((l) => l.id);

export function Nav() {
  const active = useActiveSection(ids);

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <nav className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 sm:flex sm:justify-between">
        <a href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-brand">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="oklch(0.14 0.015 260)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
            </svg>
          </span>
          <span className="truncate font-display text-[17px] font-semibold">SentinelAI</span>
        </a>
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const isActive = active === l.id;
            return (
              <a
                key={l.id}
                href={`#${l.id}`}
                onClick={(e) => scrollTo(e, l.id)}
                aria-current={isActive ? "true" : undefined}
                className={`relative rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
                <span
                  aria-hidden
                  className={`absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-brand transition-opacity duration-300 ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                />
              </a>
            );
          })}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href="/auth/login"
            className="hidden rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Sign in
          </a>
          <a
            href="/auth/signup?next=/scans"
            className="rounded-lg bg-gradient-brand px-3.5 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          >
            Start Free Scan
          </a>
        </div>
      </nav>
      <div className="flex gap-1 overflow-x-auto border-t border-border/60 px-5 py-2 md:hidden">
        {links.map((l) => {
          const isActive = active === l.id;
          return (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={(e) => scrollTo(e, l.id)}
              aria-current={isActive ? "true" : undefined}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? "bg-secondary text-foreground ring-1 ring-brand-blue/30"
                  : "text-muted-foreground"
              }`}
            >
              {l.label}
            </a>
          );
        })}
      </div>
    </header>
  );
}