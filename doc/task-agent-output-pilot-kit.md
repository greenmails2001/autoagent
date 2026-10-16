# TaskAgent Output Pilot Kit

Use this kit before expanding `task-agent-output.v1` beyond the internal deployment ring. It contains no participant feedback. All result fields must be completed by real participants.

## Participants

Recruit at least one participant from each group:

- Business user: understands the business process but does not operate TaskAgent internals.
- Developer: can interpret code, tests, and verification evidence.
- Operator/admin: owns credentials, runtime access, deployment, or recovery.

Record a participant code, not a personal name. Do not store secrets, tokens, private logs, or production customer data.

## Procedure

1. Give each participant the seven event outputs plus the 9route, failed-verification, and `not_run` scenarios from `TASK_OUTPUT_GOLDENS` in randomized order.
2. Start the timer when the output becomes visible.
3. Ask: current result, whether anything is broken, who acts, what action is required, and what happens next.
4. Stop the timer when the participant identifies the required action.
5. Let the participant attempt the safe simulated action; record completion without coaching.
6. Record clarification questions verbatim, then score the six rubric dimensions from `task-agent-output-standard.md`.
7. Ask whether any audit evidence appears missing, changed, or too prominent.

## Release gate

Broad release requires real recorded results for all three participant groups and all ten scenarios, with:

- at least 90% correct interpretation;
- median action-identification time below 30 seconds;
- at least 85% simulated action completion;
- at least 50% fewer clarification questions than the baseline wording;
- no zero score for actionability or audit fidelity;
- no altered/missing evidence and no secret exposure.

If the gate fails, keep v7 in the internal ring, revise policy/goldens, and repeat the affected scenarios. A blank pilot record means “not yet evaluated,” never “passed.”

## Artifact

Use `doc/task-agent-output-pilot-record.csv` as the append-only pilot evidence artifact. One row represents one participant/scenario attempt. The committed file contains headers only; humans conducting the pilot add observations and review them before broad release.
