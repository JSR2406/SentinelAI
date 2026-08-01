import { defineTool } from "@lovable.dev/mcp-js";
import { attackPath, severityCounts } from "@/lib/dummy-data";

export default defineTool({
  name: "get_attack_path",
  title: "Get the top exploitable attack path",
  description:
    "Return SentinelAI's highest-risk attack path — the chain of steps from repository to business impact — plus the overall severity breakdown.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify({ path: attackPath, severityCounts }, null, 2) }],
    structuredContent: { path: attackPath, severityCounts, steps: attackPath.length },
  }),
});