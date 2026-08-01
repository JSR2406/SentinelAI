import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getProfileTool from "./tools/get-profile";
import updateProfileTool from "./tools/update-profile";
import listRepositoriesTool from "./tools/list-repositories";
import listFindingsTool from "./tools/list-findings";
import getAttackPathTool from "./tools/get-attack-path";

// The OAuth issuer must be the direct Supabase host; the project ref is the only
// value that survives publish unchanged, and Vite inlines it at build time.
const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

// The SDK's tool type leaves `outputSchema` optional; under
// exactOptionalPropertyTypes the inferred `undefined` needs a widening cast.
const tools = [
  listRepositoriesTool,
  listFindingsTool,
  getAttackPathTool,
  getProfileTool,
  updateProfileTool,
] as unknown as Parameters<typeof defineMcp>[0]["tools"];

export default defineMcp({
  name: "sentinelai-landing-page",
  title: "SentinelAI Landing Page",
  version: "0.1.0",
  instructions:
    "Tools for SentinelAI, an AI-powered DevSecOps security copilot. Use `list_repositories` to see monitored repositories, `list_findings` for security issues by category and severity, `get_attack_path` for the top exploitable breach chain, and `get_profile` / `update_profile` for the signed-in user's profile.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools,
});