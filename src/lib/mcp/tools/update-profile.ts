import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_profile",
  title: "Update my SentinelAI profile",
  description: "Update the signed-in user's display name, company, or job title.",
  inputSchema: {
    display_name: z.string().trim().min(1).optional().describe("New display name."),
    company: z.string().trim().optional().describe("Company or organization name."),
    job_title: z.string().trim().optional().describe("Job title, e.g. 'Security Engineer'."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const patch = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(patch).length === 0) {
      return { content: [{ type: "text", text: "Provide at least one field to update." }], isError: true };
    }

    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", ctx.getUserId()!)
      .select("display_name, company, job_title")
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Profile updated: ${JSON.stringify(data)}` }],
      structuredContent: { profile: data },
    };
  },
});