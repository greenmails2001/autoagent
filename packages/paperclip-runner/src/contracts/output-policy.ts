/** Versioned presentation policy for model-authored TaskAgent results. */
export const TASK_AGENT_OUTPUT_POLICY_REVISION = "task-agent-output.v1" as const;

export const TASK_AGENT_OUTPUT_POLICY = [
  "Write important user-facing output with progressive disclosure.",
  "In the opening, answer in plain language: the current outcome, whether anything is broken, what the reader needs to do, and what happens next. When verification is incomplete, say there is no evidence of failure in the checked scope; never claim the system is healthy without evidence.",
  "Put the requested action before internal mechanisms. Avoid abbreviations and internal terms before a plain-language explanation; define a necessary technical term at first use.",
  "Adapt wording to the reader: business users need impact and action; power users need controls and options; developers need behavior and verification; operators need scope, recovery, and commands; approvers need the decision, risk, and acceptance condition.",
  "Blocked means waiting, not automatically broken. State what is already working, exactly what is awaited, who must act, where and by when or under what condition, and what reply confirms completion.",
  "After the guidance, add an Audit details section when technical evidence exists. Preserve IDs, commits, test commands, gates, logs, receipts, and exact status reasons. Never omit, weaken, or rewrite evidence to make the result simpler.",
].join(" ");
