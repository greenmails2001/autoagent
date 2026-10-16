import { describe, expect, it } from "vitest";

import { PAPERCLIP_EXECUTION_PROMPT } from "./runtime-context.js";
import { codexSemanticToolSpecs } from "../drivers/codex/codex-driver-values.js";
import {
  TASK_AGENT_OUTPUT_POLICY,
  TASK_AGENT_OUTPUT_POLICY_REVISION,
} from "./output-policy.js";

describe("TaskAgent output policy", () => {
  it("leads important output with outcome, health, action, and next step", () => {
    expect(TASK_AGENT_OUTPUT_POLICY_REVISION).toBe("task-agent-output.v1");
    for (const requirement of [
      "current outcome",
      "whether anything is broken",
      "what the reader needs to do",
      "what happens next",
    ]) {
      expect(TASK_AGENT_OUTPUT_POLICY).toContain(requirement);
    }
  });

  it("makes blocked output actionable without implying a system failure", () => {
    expect(TASK_AGENT_OUTPUT_POLICY).toContain("Blocked means waiting, not automatically broken");
    expect(TASK_AGENT_OUTPUT_POLICY).toContain("what is already working");
    expect(TASK_AGENT_OUTPUT_POLICY).toContain("who must act");
    expect(TASK_AGENT_OUTPUT_POLICY).toContain("where and by when or under what condition");
    expect(TASK_AGENT_OUTPUT_POLICY).toContain("what reply confirms completion");
  });

  it("preserves full audit evidence after the plain-language guidance", () => {
    expect(TASK_AGENT_OUTPUT_POLICY).toContain("Audit details");
    expect(TASK_AGENT_OUTPUT_POLICY).toContain("IDs, commits, test commands, gates, logs, receipts, and exact status reasons");
    expect(TASK_AGENT_OUTPUT_POLICY).toContain("Never omit, weaken, or rewrite evidence");
  });

  it("qualifies health claims when verification is incomplete", () => {
    expect(TASK_AGENT_OUTPUT_POLICY).toContain("no evidence of failure in the checked scope");
    expect(TASK_AGENT_OUTPUT_POLICY).toContain("never claim the system is healthy without evidence");
  });

  it("is delivered through the canonical native runtime prompt", () => {
    expect(PAPERCLIP_EXECUTION_PROMPT).toContain(TASK_AGENT_OUTPUT_POLICY);
  });

  it("accounts for prompt and tool-schema projection overhead", () => {
    const previousSummary = "The complete user-facing answer for this turn. Do not replace the requested answer with routine work/control bookkeeping. Include the requested result and any genuine actionable failure, limitation, or required user action. Unless explicitly requested, omit routine preparation, unconfirmed-delivery, and wait/review status; put the response-wake reason in continuation.summary. Never claim delivery without a confirmed receipt.";
    const tools = codexSemanticToolSpecs();
    const previousTools = structuredClone(tools);
    for (const tool of previousTools) {
      if (tool.name === "paperclip_finish" || tool.name === "paperclip_block") {
        tool.inputSchema.properties.summary.description = previousSummary;
      }
    }
    const bytes = (value: unknown) => Buffer.byteLength(typeof value === "string" ? value : JSON.stringify(value));
    const promptDelta = bytes(PAPERCLIP_EXECUTION_PROMPT)
      - bytes(PAPERCLIP_EXECUTION_PROMPT.replace(` ${TASK_AGENT_OUTPUT_POLICY}`, ""));
    const toolsDelta = bytes(tools) - bytes(previousTools);

    expect({ promptDelta, toolsDelta, fullFixedProjectionDelta: promptDelta + toolsDelta })
      .toEqual({ promptDelta: 1218, toolsDelta: 1036, fullFixedProjectionDelta: 2254 });
  });
});
