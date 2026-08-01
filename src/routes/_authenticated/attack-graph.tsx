import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { attackPath } from "@/lib/dummy-data";

export const Route = createFileRoute("/_authenticated/attack-graph")({
  head: () => ({
    meta: [
      { title: "Attack graph — SentinelAI" },
      { name: "description", content: "Interactive attack path from exposed credentials to business impact." },
    ],
  }),
  component: AttackGraphPage,
});

const positions = [
  { x: 90, y: 90 },
  { x: 300, y: 60 },
  { x: 520, y: 130 },
  { x: 300, y: 230 },
  { x: 560, y: 300 },
  { x: 820, y: 210 },
];

const nodes = attackPath.map((item, i) => ({
  ...item,
  x: positions[i]?.x ?? 0,
  y: positions[i]?.y ?? 0,
}));

function AttackGraphPage() {
  const [selected, setSelected] = useState(1);
  const node = nodes[selected] ?? nodes[0]!;

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Attack graph</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One exploitable path chains six weaknesses into a full data breach.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="glass overflow-x-auto rounded-2xl p-4">
          <svg viewBox="0 0 940 380" className="h-[380px] w-full min-w-[720px]">
            <defs>
              <linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="oklch(0.62 0.19 255)" />
                <stop offset="100%" stopColor="oklch(0.74 0.16 165)" />
              </linearGradient>
            </defs>
            {nodes.slice(0, -1).map((p, i) => {
              const n = nodes[i + 1]!;
              return (
                <line
                  key={i}
                  x1={p.x}
                  y1={p.y}
                  x2={n.x}
                  y2={n.y}
                  stroke="url(#edge)"
                  strokeWidth="2"
                  strokeDasharray="8 8"
                  opacity="0.7"
                >
                  <animate attributeName="stroke-dashoffset" from="32" to="0" dur="1.4s" repeatCount="indefinite" />
                </line>
              );
            })}
            {nodes.map((item, i) => {
              const p = item;
              const critical = item.severity === "critical";
              const active = i === selected;
              return (
                <g
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(i)}
                  role="button"
                  aria-label={item.label}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={active ? 34 : 26}
                    fill={critical ? "oklch(0.55 0.21 25 / 0.18)" : "oklch(0.62 0.19 255 / 0.16)"}
                    stroke={critical ? "oklch(0.63 0.22 25)" : "oklch(0.74 0.16 165)"}
                    strokeWidth={active ? 2.5 : 1.5}
                  />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={26}
                    fill="none"
                    stroke={critical ? "oklch(0.63 0.22 25)" : "oklch(0.74 0.16 165)"}
                    strokeWidth="1"
                    opacity="0.5"
                  >
                    <animate attributeName="r" from="26" to="44" dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.5" to="0" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                  <text
                    x={p.x}
                    y={p.y + 54}
                    textAnchor="middle"
                    className="fill-current text-[12px]"
                    fill="oklch(0.72 0.02 260)"
                  >
                    {item.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <aside className="glass rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Selected node</p>
          <h2 className="mt-2 text-lg font-semibold">{node.label}</h2>
          <span
            className={`mt-2 inline-block rounded-full px-2.5 py-1 text-[11px] capitalize ${
              node.severity === "critical"
                ? "bg-destructive/15 text-destructive"
                : "bg-chart-1/15 text-chart-1"
            }`}
          >
            {node.severity}
          </span>
          <p className="mt-4 text-sm text-muted-foreground">{node.detail}</p>
          <div className="mt-6 grid gap-2">
            {nodes.map((n, i) => (
              <button
                key={n.id}
                onClick={() => setSelected(i)}
                className={`truncate rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                  i === selected
                    ? "bg-secondary text-foreground ring-1 ring-brand-blue/30"
                    : "text-muted-foreground hover:bg-secondary/60"
                }`}
              >
                {i + 1}. {n.label}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}