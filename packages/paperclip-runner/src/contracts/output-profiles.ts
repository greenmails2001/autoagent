import { createHash } from "node:crypto";

export type TaskOutputProfileDefinition = {
  requestedId: string | null;
  id: string;
  version: string;
  text: string;
  digest: string;
  fallbackReason: "not_assigned" | "unknown_profile" | null;
  runtimeName: "task-output-profile";
  providerBindings: { codex: "SKILL.md"; claude: "skill-plugin" };
};

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const bindings = { codex: "SKILL.md", claude: "skill-plugin" } as const;

const profile = (id: string, version: string, text: string) => ({
  requestedId: `${id}.v${version}`,
  id,
  version,
  text,
  digest: sha256(text),
  fallbackReason: null,
  runtimeName: "task-output-profile",
  providerBindings: bindings,
} satisfies TaskOutputProfileDefinition);

export const CORE_DEFAULT_OUTPUT_PROFILE = profile(
  "core-default",
  "1",
  "Use the mandatory TaskAgent output contract without additional audience styling. Keep the opening concise and retain exact audit evidence.",
);

const PROFILES = new Map([
  ["plain-vietnamese.v1", profile("plain-vietnamese", "1", "Write natural Vietnamese for a non-technical reader. Lead with practical impact and the exact action. Define necessary technical terms at first use; keep IDs, commands, tests, gates, logs, and receipts in Audit details.")],
  ["developer.v1", profile("developer", "1", "Write for a developer. Lead with behavior and required action, then include changed surfaces, verification verdicts, limitations, and exact code or test evidence in Audit details.")],
  ["operator.v1", profile("operator", "1", "Write for an operator. Lead with service health, affected scope, owner, recovery action, and resume condition. Preserve exact commands, receipts, logs, rollback, and verification status in Audit details.")],
  ["approver.v1", profile("approver", "1", "Write for an approver. Lead with the decision requested, user impact, risk, acceptance condition, and next transition. Preserve diffs, gates, tests, IDs, and receipts in Audit details.")],
]);

export function resolveTaskOutputProfile(requestedId: string | null | undefined): TaskOutputProfileDefinition {
  if (!requestedId) return { ...CORE_DEFAULT_OUTPUT_PROFILE, requestedId: null, fallbackReason: "not_assigned" };
  const resolved = PROFILES.get(requestedId);
  return resolved ? { ...resolved } : { ...CORE_DEFAULT_OUTPUT_PROFILE, requestedId, fallbackReason: "unknown_profile" };
}
