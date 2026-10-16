# TaskAgent Output Profile Migration and Canary

The core output invariant remains mandatory. Profiles are additive, server-selected presentation instructions; they cannot remove outcome, health, action, next-step, blocker, or audit-evidence requirements.

## Assignment

Set `agent.runtimeConfig.taskOutputProfile` to a versioned profile ID: `plain-vietnamese.v1`, `developer.v1`, `operator.v1`, or `approver.v1`. Missing assignment and unknown IDs fail closed to `core-default.v1`. The runtime snapshot records requested ID, effective ID/version, text digest, fallback reason, runtime name, and provider binding metadata.

Codex receives the trusted profile content through its native system-instruction adapter, equivalent to an assigned `SKILL.md` without depending on `/skill` discovery. Claude/ACPX receives the same immutable content through its system/plugin instruction channel, equivalent to an assigned skill-plugin. Provider-specific discovery remains optional; the authoritative server snapshot is always composed.

## Canary

1. Keep unassigned agents on `core-default.v1`.
2. Assign `plain-vietnamese.v1` to one internal agent, then one squad.
3. Compare instruction bytes, rubric score, clarification count, action completion, and exact evidence preservation against the core baseline.
4. Promote company-wide only after the real business/developer/operator pilot passes.
5. Roll back by removing or pinning `taskOutputProfile`; the next run snapshots core default. Existing run snapshots stay immutable and auditable.

Do not use profile assignment to claim broad-release approval. Broad release still requires the reviewed human pilot artifact.
