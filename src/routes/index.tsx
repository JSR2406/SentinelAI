import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/landing/Nav";
import { AttackGraph } from "@/components/landing/AttackGraph";
import { Features } from "@/components/landing/Features";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";

const title = "SentinelAI — AI Security Copilot for Developers";
const description =
  "Scan your code, APIs, cloud, AI applications and infrastructure before hackers do. SentinelAI is the AI security copilot for modern engineering teams.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full blur-[120px]"
        style={{ background: "var(--gradient-soft)" }}
      />
      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-emerald" />
            Now scanning LLM agents and MCP tools
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.08] sm:text-6xl">
            AI Security Copilot for{" "}
            <span className="text-gradient">Modern Developers</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Scan your code, APIs, cloud, AI applications and infrastructure before hackers do.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/auth/signup?next=/scans"
              className="w-full rounded-xl bg-gradient-brand px-6 py-3 text-center text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 sm:w-auto"
            >
              Start Free Scan
            </a>
            <a
              href="#product"
              className="glass inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:border-brand-blue/50 sm:w-auto"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                <path d="M12 2a10 10 0 00-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.1-1.47-1.1-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 015 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0012 2z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
        <div className="mt-16 animate-float sm:mt-20">
          <AttackGraph />
        </div>
      </div>
    </section>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <Hero />
        <Features />
        <Testimonials />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
