export type Severity = "critical" | "high" | "medium" | "low";

export const repositories = [
  {
    id: "1",
    name: "payments-api",
    owner: "sentinel-labs",
    branch: "main",
    language: "TypeScript",
    status: "Critical",
    lastScan: "12 minutes ago",
    issues: { critical: 3, high: 7, medium: 12, low: 20 },
  },
  {
    id: "2",
    name: "sentinel-web",
    owner: "sentinel-labs",
    branch: "develop",
    language: "TypeScript",
    status: "Passing",
    lastScan: "1 hour ago",
    issues: { critical: 0, high: 1, medium: 4, low: 9 },
  },
  {
    id: "3",
    name: "auth-service",
    owner: "sentinel-labs",
    branch: "main",
    language: "Go",
    status: "Warning",
    lastScan: "4 hours ago",
    issues: { critical: 0, high: 4, medium: 6, low: 11 },
  },
  {
    id: "4",
    name: "ml-inference",
    owner: "sentinel-research",
    branch: "main",
    language: "Python",
    status: "Critical",
    lastScan: "yesterday",
    issues: { critical: 2, high: 5, medium: 8, low: 14 },
  },
  {
    id: "5",
    name: "infra-terraform",
    owner: "sentinel-platform",
    branch: "main",
    language: "HCL",
    status: "Warning",
    lastScan: "2 days ago",
    issues: { critical: 1, high: 2, medium: 9, low: 6 },
  },
  {
    id: "6",
    name: "docs-site",
    owner: "sentinel-labs",
    branch: "main",
    language: "MDX",
    status: "Passing",
    lastScan: "3 days ago",
    issues: { critical: 0, high: 0, medium: 2, low: 5 },
  },
];

export const recentScans = [
  { id: "s1", repo: "payments-api", type: "Full scan", status: "Completed", duration: "1m 42s", when: "12m ago", findings: 42 },
  { id: "s2", repo: "sentinel-web", type: "Dependencies", status: "Completed", duration: "38s", when: "1h ago", findings: 14 },
  { id: "s3", repo: "auth-service", type: "Secrets", status: "Completed", duration: "22s", when: "4h ago", findings: 21 },
  { id: "s4", repo: "ml-inference", type: "AI security", status: "Failed", duration: "12s", when: "yesterday", findings: 0 },
  { id: "s5", repo: "infra-terraform", type: "Cloud posture", status: "Completed", duration: "2m 05s", when: "2d ago", findings: 18 },
];

export const activity = [
  { who: "AI Copilot", what: "opened a fix PR for CVE-2026-1187 in auth-service", when: "6m ago" },
  { who: "maya.ortiz", what: "dismissed 3 low-severity findings in docs-site", when: "42m ago" },
  { who: "Scanner", what: "detected an exposed AWS key in payments-api", when: "1h ago" },
  { who: "dev.raman", what: "imported repository ml-inference", when: "3h ago" },
  { who: "AI Copilot", what: "generated a security report for sentinel-web", when: "yesterday" },
];

export const issueCategories: {
  category: string;
  issues: { severity: Severity; description: string; fix: string; file: string }[];
}[] = [
  {
    category: "Secrets",
    issues: [
      {
        severity: "critical",
        description: "AWS access key committed to source control",
        fix: "Revoke the key in IAM and move it to the managed secret store.",
        file: "services/payments/config/aws.ts:14",
      },
      {
        severity: "high",
        description: "Stripe test secret present in CI logs",
        fix: "Mask the variable in the CI provider and rotate the key.",
        file: ".github/workflows/deploy.yml:37",
      },
    ],
  },
  {
    category: "Dependencies",
    issues: [
      {
        severity: "critical",
        description: "Prototype pollution in lodash < 4.17.21 (reachable)",
        fix: "Upgrade lodash to 4.17.21 and re-run the reachability scan.",
        file: "package.json:32",
      },
      {
        severity: "medium",
        description: "Transitive dependency with unmaintained upstream",
        fix: "Replace `left-pad` with the native String.prototype.padStart.",
        file: "pnpm-lock.yaml:1204",
      },
    ],
  },
  {
    category: "Authentication",
    issues: [
      {
        severity: "high",
        description: "JWT verification skips audience validation",
        fix: "Pass the expected `aud` claim to the verifier and fail closed.",
        file: "internal/auth/jwt.go:88",
      },
      {
        severity: "low",
        description: "Session cookie missing SameSite attribute",
        fix: "Set SameSite=Lax on the session cookie.",
        file: "internal/auth/session.go:41",
      },
    ],
  },
  {
    category: "Cloud",
    issues: [
      {
        severity: "critical",
        description: "S3 bucket allows public list access",
        fix: "Enable Block Public Access and scope the bucket policy to the app role.",
        file: "infra/s3.tf:22",
      },
      {
        severity: "medium",
        description: "IAM role grants wildcard actions on all resources",
        fix: "Replace `*` with the four actions the service actually calls.",
        file: "infra/iam.tf:57",
      },
    ],
  },
  {
    category: "Database",
    issues: [
      {
        severity: "high",
        description: "Row level security disabled on `invoices`",
        fix: "Enable RLS and add an owner-scoped read policy.",
        file: "db/migrations/0031_invoices.sql:9",
      },
      {
        severity: "low",
        description: "Backups retained for only 3 days",
        fix: "Increase point-in-time recovery to 14 days.",
        file: "infra/rds.tf:18",
      },
    ],
  },
  {
    category: "Containers",
    issues: [
      {
        severity: "medium",
        description: "Container runs as root user",
        fix: "Add a non-root USER directive to the final stage.",
        file: "Dockerfile:28",
      },
      {
        severity: "high",
        description: "Base image has 6 known high-severity CVEs",
        fix: "Rebuild on node:22-alpine and pin the digest.",
        file: "Dockerfile:1",
      },
    ],
  },
];

export const severityCounts = { critical: 7, high: 19, medium: 41, low: 65 };

export const attackPath = [
  { id: "repo", label: "Repository", detail: "payments-api · main branch", severity: "low" as Severity },
  { id: "key", label: "Exposed API Key", detail: "AWS access key in aws.ts:14", severity: "critical" as Severity },
  { id: "db", label: "Database Access", detail: "RDS cluster reachable with leaked role", severity: "critical" as Severity },
  { id: "priv", label: "Privilege Escalation", detail: "IAM wildcard allows role assumption", severity: "high" as Severity },
  { id: "leak", label: "Data Leak", detail: "1.2M customer invoice records exposed", severity: "critical" as Severity },
  { id: "impact", label: "Business Impact", detail: "Est. $2.4M breach cost · GDPR exposure", severity: "critical" as Severity },
];

export const conversations = [
  { id: "c1", title: "Fix exposed AWS key", when: "Today" },
  { id: "c2", title: "Explain CVE-2026-1187", when: "Today" },
  { id: "c3", title: "Harden Dockerfile", when: "Yesterday" },
  { id: "c4", title: "RLS policy review", when: "Mon" },
  { id: "c5", title: "Quarterly report draft", when: "Last week" },
];