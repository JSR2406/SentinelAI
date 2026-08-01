import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { issueCategories, severityCounts } from "@/lib/dummy-data";

export default defineTool({
  name: "list_findings",
  title: "List security findings",
  description:
    "List SentinelAI security findings grouped by category (Secrets, Dependencies, Authentication, Cloud, Database, Containers), optionally filtered by category or severity.",
  inputSchema: {
    category: z.string().trim().optional().describe("Category name, e.g. 'Secrets' or 'Dependencies'."),
    severity: z
      .enum(["critical", "high", "medium", "low"])
      .optional()
      .describe("Only return findings at this severity."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ category, severity }) => {
    const wanted = category?.toLowerCase();
    const groups = issueCategories
      .filter((group) => !wanted || group.category.toLowerCase() === wanted)
      .map((group) => ({
        category: group.category,
        issues: severity ? group.issues.filter((issue) => issue.severity === severity) : group.issues,
      }))
      .filter((group) => group.issues.length > 0);

    if (groups.length === 0) {
      const available = issueCategories.map((group) => group.category).join(", ");
      return { content: [{ type: "text", text: `No findings matched. Available categories: ${available}.` }] };
    }

    const total = groups.reduce((sum, group) => sum + group.issues.length, 0);
    return {
      content: [{ type: "text", text: JSON.stringify({ totals: severityCounts, groups }, null, 2) }],
      structuredContent: { totals: severityCounts, groups, count: total },
    };
  },
});