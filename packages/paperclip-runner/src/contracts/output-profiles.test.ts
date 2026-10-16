import { describe, expect, it } from "vitest";

import {
  CORE_DEFAULT_OUTPUT_PROFILE,
  resolveTaskOutputProfile,
} from "./output-profiles.js";

describe("TaskAgent presentation profiles", () => {
  it("resolves a versioned assigned profile", () => {
    expect(resolveTaskOutputProfile("plain-vietnamese.v1")).toMatchObject({
      requestedId: "plain-vietnamese.v1",
      id: "plain-vietnamese",
      version: "1",
      fallbackReason: null,
      runtimeName: "task-output-profile",
      providerBindings: { codex: "SKILL.md", claude: "skill-plugin" },
    });
  });

  it("fails closed to core default for an unknown assignment", () => {
    expect(resolveTaskOutputProfile("invented.v9")).toEqual({
      ...CORE_DEFAULT_OUTPUT_PROFILE,
      requestedId: "invented.v9",
      fallbackReason: "unknown_profile",
    });
  });

  it("uses core default when no profile is assigned", () => {
    expect(resolveTaskOutputProfile(null)).toEqual({
      ...CORE_DEFAULT_OUTPUT_PROFILE,
      requestedId: null,
      fallbackReason: "not_assigned",
    });
  });
});
