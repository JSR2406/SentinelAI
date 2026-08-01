const tiers = [
  {
    name: "Free",
    price: "$0",
    note: "per month",
    desc: "For solo developers and side projects.",
    features: ["3 repositories", "Secret detection", "Dependency scanning", "Community support"],
    cta: "Start Free Scan",
    href: "/auth/signup?next=/scans",
    featured: false,
  },
  {
    name: "Team",
    price: "$49",
    note: "per developer / month",
    desc: "For product teams shipping to production.",
    features: [
      "Unlimited repositories",
      "AI security testing",
      "Attack graph & blast radius",
      "AI fix pull requests",
      "Slack & Jira workflows",
    ],
    cta: "Start 14-day trial",
    href: "/auth/signup?next=/scans",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    note: "annual contract",
    desc: "For regulated and large-scale organizations.",
    features: [
      "SSO, SCIM & audit logs",
      "Multi-cloud CSPM",
      "Private model deployment",
      "Dedicated security engineer",
    ],
    cta: "Talk to sales",
    href: "mailto:sales@sentinelai.dev",
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-24 mx-auto max-w-6xl px-5 py-20 sm:py-28">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-brand-emerald">Pricing</p>
        <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Simple, developer-first plans</h2>
      </div>
      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`glass relative rounded-2xl p-7 ${t.featured ? "glow ring-1 ring-brand-blue/50" : ""}`}
          >
            {t.featured && (
              <span className="absolute -top-3 left-7 rounded-full bg-gradient-brand px-3 py-1 text-[11px] font-semibold text-accent-foreground">
                Most popular
              </span>
            )}
            <h3 className="text-lg font-semibold">{t.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
            <p className="mt-6 flex items-baseline gap-2">
              <span className="font-display text-4xl font-semibold">{t.price}</span>
              <span className="text-xs text-muted-foreground">{t.note}</span>
            </p>
            <ul className="mt-6 space-y-3">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <svg
                    viewBox="0 0 24 24"
                    className="mt-0.5 h-4 w-4 shrink-0 stroke-brand-emerald"
                    fill="none"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <a
              href={t.href}
              className={`mt-8 block rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition-opacity hover:opacity-90 ${
                t.featured
                  ? "bg-gradient-brand text-accent-foreground"
                  : "border border-border text-foreground"
              }`}
            >
              {t.cta}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}