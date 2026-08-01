const nodes = [
  { id: "internet", label: "Internet", x: 60, y: 140, tone: "blue" },
  { id: "api", label: "Public API", x: 200, y: 70, tone: "blue" },
  { id: "svc", label: "Auth Service", x: 200, y: 215, tone: "blue" },
  { id: "iam", label: "IAM Role", x: 355, y: 140, tone: "emerald" },
  { id: "s3", label: "Data Store", x: 515, y: 80, tone: "emerald" },
  { id: "ai", label: "LLM Agent", x: 515, y: 215, tone: "emerald" },
];

const edges: [string, string][] = [
  ["internet", "api"],
  ["internet", "svc"],
  ["api", "iam"],
  ["svc", "iam"],
  ["iam", "s3"],
  ["iam", "ai"],
];

type GraphNode = (typeof nodes)[number];
const at = (id: string): GraphNode => nodes.find((n) => n.id === id) ?? nodes[0]!;

export function AttackGraph() {
  return (
    <div className="glass glow relative overflow-hidden rounded-3xl p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-brand-emerald" />
          <p className="truncate text-sm font-medium text-foreground">
            Live attack path analysis
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
          3 exploitable paths
        </span>
      </div>
      <svg viewBox="0 0 600 300" className="h-auto w-full" role="img" aria-label="Animated attack graph showing exploitable paths from the internet to cloud data stores">
        <defs>
          <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.62 0.19 255)" />
            <stop offset="100%" stopColor="oklch(0.74 0.16 165)" />
          </linearGradient>
        </defs>
        {edges.map(([a, b], i) => (
          <line
            key={`${a}-${b}`}
            x1={at(a).x}
            y1={at(a).y}
            x2={at(b).x}
            y2={at(b).y}
            stroke="url(#edgeGrad)"
            strokeWidth="1.75"
            strokeDasharray="6 10"
            className="animate-dash"
            style={{ animationDelay: `${i * 0.25}s`, opacity: 0.85 }}
          />
        ))}
        {nodes.map((n, i) => (
          <g key={n.id}>
            <circle
              cx={n.x}
              cy={n.y}
              r={22}
              fill={n.tone === "blue" ? "oklch(0.62 0.19 255 / 12%)" : "oklch(0.74 0.16 165 / 12%)"}
              stroke={n.tone === "blue" ? "oklch(0.62 0.19 255 / 45%)" : "oklch(0.74 0.16 165 / 45%)"}
            />
            <circle
              cx={n.x}
              cy={n.y}
              r={6}
              fill={n.tone === "blue" ? "oklch(0.62 0.19 255)" : "oklch(0.74 0.16 165)"}
              className="animate-pulse-node"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
            <text
              x={n.x}
              y={n.y + 42}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: 12 }}
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}