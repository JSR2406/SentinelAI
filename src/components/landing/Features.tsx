const features = [
  {
    title: "Secret Detection",
    body: "Catch leaked keys, tokens and credentials across commits, branches and CI logs before they ship.",
    icon: "M7 11V8a5 5 0 0110 0v3M5 11h14v9H5z",
  },
  {
    title: "AI Security",
    body: "Test LLM apps for prompt injection, jailbreaks, unsafe tool calls and data exfiltration paths.",
    icon: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 8v4l3 2",
  },
  {
    title: "Dependency Scanner",
    body: "Reachability-aware SCA that tells you which CVEs are actually exploitable in your code.",
    icon: "M12 3l8 4.5v9L12 21l-8-4.5v-9z",
  },
  {
    title: "Attack Graph",
    body: "Map identity, network and data relationships to see the full blast radius of every finding.",
    icon: "M6 6h4v4H6zM14 14h4v4h-4zM10 8h4v6",
  },
  {
    title: "Cloud Security",
    body: "Continuous CSPM across AWS, GCP and Azure with drift detection and least-privilege insights.",
    icon: "M7 18a4 4 0 010-8 6 6 0 0111.3 2A3.5 3.5 0 0117 18z",
  },
  {
    title: "AI Fix Suggestions",
    body: "One-click patches with tested pull requests, written in your codebase's own conventions.",
    icon: "M4 12h5l2-6 3 12 2-6h4",
  },
];

export function Features() {
  return (
    <section id="product" className="scroll-mt-24 mx-auto max-w-6xl px-5 py-20 sm:py-28">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-brand-emerald">Platform</p>
        <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
          One copilot for your entire attack surface
        </h2>
        <p className="mt-4 text-muted-foreground">
          Six engines, one graph. SentinelAI correlates every signal so your team fixes what
          actually matters.
        </p>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <article
            key={f.title}
            className="glass group rounded-2xl p-6 transition-colors hover:border-brand-blue/40"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary ring-1 ring-border">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 stroke-brand-emerald"
                fill="none"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={f.icon} />
              </svg>
            </span>
            <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}