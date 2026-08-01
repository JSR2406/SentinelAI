import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { repositories } from "@/lib/dummy-data";

export default defineTool({
  name: "list_repositories",
  title: "List monitored repositories",
  description:
    "List the repositories SentinelAI monitors, with language, branch, scan status and issue counts by severity.",
  inputSchema: {
    status: z
      .enum(["Critical", "Warning", "Passing"])
      .optional()
      .describe("Only return repositories with this scan status."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ status }) => {
    const items = status ? repositories.filter((repo) => repo.status === status) : repositories;
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { repositories: items, count: items.length },
    };
  },
});