# TaskAgent Output Standard v1

This standard changes how TaskAgent explains results. It does not change routing, task state transitions, completion schemas, security controls, or audit storage.

## Reader policy

| Reader | Lead with | Put in audit details |
| --- | --- | --- |
| Business user | Outcome, impact, required action | IDs, commands, logs |
| Power user | Outcome, choices, safe controls | Exact policy and state evidence |
| Developer | Behavior, changed surface, verification | Commits, tests, traces |
| Admin/operator | Service health, affected scope, recovery | Commands, receipts, logs |
| Approver | Decision requested, risk, acceptance condition | Diffs, gates, evidence IDs |

When the audience is unknown, use business-user language first and retain a compact `Audit details` section. Add detail only when it helps the reader decide, act, verify, or recover.

## Required opening

Every important output answers these four questions before internal mechanics:

1. What is the current outcome?
2. Is anything broken?
3. What does the reader need to do?
4. What happens next?

Avoid abbreviations. Explain necessary technical terms at first use. Never simplify by deleting a real limitation, security condition, failed check, identifier, or receipt.

## Templates

### Completed

```markdown
Đã hoàn tất: <kết quả và phạm vi ảnh hưởng>. Không phát hiện lỗi còn mở.

Bạn không cần làm gì thêm. Bước tiếp theo: <review/release/none>.

Audit details
- Commit: <sha>
- Verification: <command and result>
- Issue/status evidence: <ids/receipts>
```

### Blocked

```markdown
Phần <đã hoạt động> vẫn hoạt động bình thường; sản phẩm chưa được xác định là hỏng.

Hiện công việc đang chờ <điều kiện/quyết định/thao tác>. <người chịu trách nhiệm> cần <hành động> tại <nơi thực hiện> trước <thời hạn>, hoặc khi <điều kiện> xảy ra. Sau đó phản hồi <nội dung xác nhận> để TaskAgent tiếp tục.

Audit details
- Blocker reason: <exact reason>
- Owner/scope: <owner and current_track|task_wide>
- Evidence: <ids/logs/receipts>
```

### Approval needed

```markdown
Cần bạn phê duyệt <quyết định>. Chưa có lỗi kỹ thuật; thay đổi đang dừng an toàn để tránh <rủi ro>.

Hãy chọn <approve/reject/request changes> tại <link/place>. Khi được duyệt, <next step>.

Audit details
- Change/risk: <exact scope>
- Review evidence: <diff, tests, gate>
```

### User action needed

```markdown
Hệ thống đã hoàn tất <phần đã xong> và đang chờ bạn <thao tác cụ thể>.

Thực hiện tại <place> trong <time/condition>, rồi trả lời <confirmation>. Sau đó TaskAgent sẽ <next step>.
```

### Technical failure

```markdown
<Kết quả> chưa hoàn tất vì <plain-language failure>. Phạm vi ảnh hưởng: <scope>. <What remains healthy> vẫn hoạt động.

<Owner> cần <recovery action>. Sau khi kiểm tra <success condition>, chạy lại <next step>.

Audit details
- Error/log: <exact evidence>
- Verification: <failed or not_run with reason>
- Rollback/retry: <command or condition>
```

### Review changes

```markdown
Review yêu cầu sửa <behavior/scope>; chưa thể chấp nhận bản hiện tại. Không có bằng chứng cho thấy phần ngoài phạm vi này bị lỗi.

Người thực hiện cần <changes> và gửi lại <tests/diff>. Bước tiếp theo là review lại theo <acceptance condition>.
```

### Handoff

```markdown
<Completed scope> đã xong; phần còn lại được bàn giao cho <owner>. Không có lỗi mới được ghi nhận.

<Owner> tiếp tục với <action>. Khi <completion signal> xuất hiện, <parent/follow-up> tiếp tục.
```

## Vietnamese before/after example

Before:

> Heartbeat bị blocked do identity binding chưa pass capability gate. Chờ probe 9route rồi update ledger.

After:

> Cổng 9route hiện vẫn hoạt động; chưa có bằng chứng hệ thống bị hỏng. Công việc đang chờ quản trị viên xác nhận đúng tài khoản triển khai trước khi cho phép kiểm tra kết nối. Quản trị viên hãy xác nhận tài khoản trong trang Runtime Access, rồi trả lời “đã xác nhận”. Sau đó TaskAgent sẽ chạy lại kiểm tra và tiếp tục phát hành.
>
> Audit details
> - Trạng thái nội bộ: `blocked`
> - Điều kiện chờ: identity binding/capability gate
> - Bằng chứng giữ nguyên: probe ID, route result và toàn bộ ledger custom

## Evaluation rubric and pilot

Score each scenario from 0 to 2. A release candidate must score at least 11/12, with no zero for actionability or audit fidelity.

| Dimension | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Outcome | Missing | Implied | Explicit first |
| Health | Blocked implies broken | Ambiguous | Healthy/broken scope explicit |
| Actionability | No owner/action | Partial | Owner, place, timing/condition, reply |
| Next step | Missing | Generic | Concrete transition |
| Plain language | Internal terms lead | Some terms explained | Plain meaning leads; terms defined |
| Audit fidelity | Evidence lost/changed | Partial | IDs, tests, gates, logs preserved |

Pilot with at least one business user, developer, and operator. Use the same seven event scenarios. Record: correct interpretation without help, seconds to identify the action, action completion, clarification questions, rubric score, and missing evidence. Target: at least 90% correct interpretation, median action-identification time under 30 seconds, at least 85% action completion, and at least 50% fewer clarification questions than the baseline. Do not claim pilot feedback until real participants complete it.

The executable golden set also includes 9route, failed-verification, and `not_run` regressions in `packages/paperclip-runner/src/eval/task-output-goldens.ts`. Conduct the human pilot with `doc/task-agent-output-pilot-kit.md` and record actual observations in `doc/task-agent-output-pilot-record.csv`. The committed record intentionally contains headers only; broad release remains gated on real participants completing it.

## Token and audit assessment

The native prompt and provider tool schemas both carry this policy, so cost assessment must use the full delivered projection rather than counting the prompt paragraph alone. Against v6-compatible summary descriptions, the fixed v7 delta is 1,218 prompt bytes plus 1,036 tool-schema bytes: 2,254 UTF-8 bytes per delivered projection, approximately 564 tokens at four characters per token. This is a planning estimate, not provider billing. Record prompt, tools, input, and full-projection deltas for start, resume, and continuation with `native-instruction-measurement.test.ts`; tokenizer and billed usage belong to the provider. Pilot output should remain concise: default opening under 120 words, then evidence already required by the task.

Accuracy risk is mainly invented health claims or omitted evidence. Mitigate it by saying “no evidence of failure” instead of “healthy” when verification is incomplete, using `not_run` with a reason code, and copying exact evidence into the audit section. The structured completion claim, verification, blocker owner/action, IDs, receipts, run log, and custom ledger remain authoritative and unchanged.

## Rollout and rollback

1. Ship as `task-agent-output.v1` in `paperclip-execution.v7`. Use runner release version pinning/deployment rings to keep v6 on general agents while v7 starts with internal runtime/operator agents; this change does not add an in-process feature flag.
2. Run contract tests, instruction measurement, and the three-role pilot. Compare clarification count, comprehension time, completion rate, output length, and missing/altered evidence.
3. Expand to developer and approver agents, then business-facing agents when thresholds pass. Existing custom instructions may add tone but must not weaken the four-question opening or audit fidelity.
4. Regression-check all seven templates plus a 9route case, a failed verification, and a `not_run` verification. Confirm completion schema and ledger records are byte-for-byte unaffected by presentation changes.
5. Roll back by pinning affected deployment rings to the previous runner release, then reverting the runtime prompt revision and completion-result JSON-schema descriptions to v6 behavior. Structured results, 9route logic, stored ledger, issue history, and evidence require no data migration or rollback.

Release monitoring: sample outputs for missing action owner, blocked-as-broken wording, unexplained internal terms, audit evidence loss, and material token growth. Pause expansion if any audit evidence is altered or if clarification questions increase.
