const quotes = [
  {
    quote:
      "SentinelAI cut our triage backlog by 80%. The attack graph finally showed us which findings were real.",
    name: "Maya Ortiz",
    role: "Head of AppSec, Northwind",
  },
  {
    quote:
      "It caught a leaked production key in a fork within seconds. That alone paid for the year.",
    name: "Dev Raman",
    role: "Staff Engineer, Loopline",
  },
  {
    quote:
      "The only scanner that understands our LLM agents. Prompt injection coverage is genuinely good.",
    name: "Sofia Lindqvist",
    role: "CTO, Parallel AI",
  },
];

export function Testimonials() {
  return (
    <section id="security" className="scroll-mt-24 mx-auto max-w-6xl px-5 py-20 sm:py-28">
      <h2 className="max-w-xl text-3xl font-semibold sm:text-4xl">
        Trusted by teams shipping fast
      </h2>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {quotes.map((q) => (
          <figure key={q.name} className="glass flex flex-col justify-between rounded-2xl p-6">
            <blockquote className="text-[15px] leading-relaxed text-foreground/90">
              “{q.quote}”
            </blockquote>
            <figcaption className="mt-6 flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-brand text-xs font-semibold text-accent-foreground">
                {q.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{q.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{q.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}