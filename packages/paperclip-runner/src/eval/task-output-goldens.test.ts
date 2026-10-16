import { describe, expect, it } from "vitest";

import {
  TASK_OUTPUT_GOLDENS,
  evaluateTaskOutputGolden,
} from "./task-output-goldens.js";

describe("TaskAgent behavioral output goldens", () => {
  it("covers every required event and regression scenario", () => {
    expect(TASK_OUTPUT_GOLDENS.map((fixture) => fixture.id)).toEqual([
      "completed",
      "blocked",
      "approval_needed",
      "user_action_needed",
      "technical_failure",
      "review_changes",
      "handoff",
      "9route_blocked",
      "failed_verification",
      "not_run_verification",
    ]);
  });

  it.each(TASK_OUTPUT_GOLDENS)("accepts $id", (fixture) => {
    expect(evaluateTaskOutputGolden(fixture)).toEqual([]);
  });

  it("detects missing owner/action and altered evidence", () => {
    const blocked = structuredClone(
      TASK_OUTPUT_GOLDENS.find((fixture) => fixture.id === "blocked")!,
    );
    blocked.output = blocked.output
      .replaceAll(blocked.owner!, "")
      .replace(blocked.action!, "")
      .replace(blocked.evidence[0]!, "changed-id");

    expect(evaluateTaskOutputGolden(blocked)).toEqual(expect.arrayContaining([
      "missing action owner",
      "missing required action",
      `missing audit evidence: ${blocked.evidence[0]}`,
    ]));
  });

  it("rejects internal terminology before the plain-language outcome", () => {
    const route = structuredClone(
      TASK_OUTPUT_GOLDENS.find((fixture) => fixture.id === "9route_blocked")!,
    );
    route.output = `identity binding capability gate heartbeat. ${route.output}`;

    expect(evaluateTaskOutputGolden(route)).toContain(
      "internal terminology appears before the plain-language opening",
    );
  });
});
