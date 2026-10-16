# TaskAgent Output Profile Migration and Canary

The core output invariant remains mandatory. Profiles are additive, server-selected presentation instructions; they cannot remove outcome, health, action, next-step, blocker, or audit-evidence requirements.

## Assignment

Set `agent.runtimeConfig.taskOutputProfile` to a versioned profile ID: `plain-vietnamese.v1`, `developer.v1`, `operator.v1`, or `approver.v1`. Missing assignment and unknown IDs fail closed to `core-default.v1`. The runtime snapshot records requested ID, effective ID/version, text digest, fallback reason, runtime name, and provider binding metadata.

The server materializes the selected profile as an immutable, content-addressed `task-output-profile/SKILL.md` assignment. Codex receives that skill input automatically even when the task never names it. Claude/ACPX installs the same snapshot in its isolated skill-plugin directory while the authoritative profile text remains in system instructions, so presentation does not depend on the model choosing to invoke a skill. A missing asset or reserved-name collision aborts context creation instead of weakening the core contract.

## Canary

1. Keep unassigned agents on `core-default.v1`.
2. Assign `plain-vietnamese.v1` to one internal agent, then one squad.
3. Compare instruction bytes, rubric score, clarification count, action completion, and exact evidence preservation against the core baseline.
4. Promote company-wide only after the real business/developer/operator pilot passes.
5. Roll back by removing or pinning `taskOutputProfile`; the next run snapshots core default. Existing run snapshots stay immutable and auditable.

Do not use profile assignment to claim broad-release approval. Broad release still requires the reviewed human pilot artifact.
