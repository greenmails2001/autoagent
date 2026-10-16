import { describe, expect, it } from "vitest";

import { evaluateTaskOutputGolden, type TaskOutputGolden } from "./task-output-goldens.js";

const invariant = {
  outcome: "Thay đổi đã sẵn sàng cho internal pilot",
  health: "Không phát hiện lỗi trong phạm vi đã kiểm tra",
  action: "Pilot owner cần chạy kịch bản được giao",
  nextStep: "Ghi nhận kết quả thật trước khi broad release",
  owner: "Pilot owner",
  evidence: ["verification: 104/104 pass", "release gate: real pilot pending"],
};

const profileGoldens: Array<TaskOutputGolden & { profile: string; audienceSignal: string }> = [
  {
    ...invariant,
    id: "plain-vietnamese.v1",
    profile: "plain-vietnamese.v1",
    audienceSignal: "Nói ngắn gọn",
    output: `Nói ngắn gọn: ${invariant.outcome}. ${invariant.health}. ${invariant.action}. ${invariant.nextStep}.\n\nAudit details\n- ${invariant.evidence[0]}\n- ${invariant.evidence[1]}`,
  },
  {
    ...invariant,
    id: "developer.v1",
    profile: "developer.v1",
    audienceSignal: "Behavior",
    output: `${invariant.outcome}. ${invariant.health}. ${invariant.action}. ${invariant.nextStep}.\n\nBehavior\n- Core output invariant remains enforced.\n\nAudit details\n- ${invariant.evidence[0]}\n- ${invariant.evidence[1]}`,
  },
  {
    ...invariant,
    id: "operator.v1",
    profile: "operator.v1",
    audienceSignal: "Rollback",
    output: `${invariant.outcome}. ${invariant.health}. ${invariant.action}. ${invariant.nextStep}.\n\nRollback\n- Remove the profile assignment; core-default.v1 remains active.\n\nAudit details\n- ${invariant.evidence[0]}\n- ${invariant.evidence[1]}`,
  },
  {
    ...invariant,
    id: "approver.v1",
    profile: "approver.v1",
    audienceSignal: "Decision",
    output: `${invariant.outcome}. ${invariant.health}. ${invariant.action}. ${invariant.nextStep}.\n\nDecision\n- Approve internal pilot only; broad release remains gated.\n\nAudit details\n- ${invariant.evidence[0]}\n- ${invariant.evidence[1]}`,
  },
];

describe("TaskAgent presentation profile behavioral goldens", () => {
  it.each(profileGoldens)("preserves core invariants and audit evidence for $profile", (fixture) => {
    expect(evaluateTaskOutputGolden(fixture)).toEqual([]);
    expect(fixture.output).toContain(fixture.audienceSignal);
  });

  it.each(profileGoldens)("detects evidence loss for $profile", (fixture) => {
    const changed = { ...fixture, output: fixture.output.replace(fixture.evidence[1]!, "") };
    expect(evaluateTaskOutputGolden(changed)).toContain(`missing audit evidence: ${fixture.evidence[1]}`);
  });
});
