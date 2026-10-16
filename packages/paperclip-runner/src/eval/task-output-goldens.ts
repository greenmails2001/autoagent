export type TaskOutputGolden = {
  id: string;
  output: string;
  outcome: string;
  health: string;
  action: string;
  nextStep: string;
  owner?: string;
  evidence: string[];
  forbiddenOpeningTerms?: string[];
};

const audit = (lines: string[]) => `\n\nAudit details\n${lines.map((line) => `- ${line}`).join("\n")}`;

export const TASK_OUTPUT_GOLDENS: TaskOutputGolden[] = [
  {
    id: "completed",
    outcome: "Đã hoàn tất thay đổi",
    health: "Không phát hiện lỗi còn mở trong phạm vi đã kiểm tra",
    action: "Bạn không cần làm gì thêm",
    nextStep: "Bước tiếp theo là review bản phát hành",
    evidence: ["commit 129c27a9a", "38/38 tests passed"],
    output: `Đã hoàn tất thay đổi. Không phát hiện lỗi còn mở trong phạm vi đã kiểm tra. Bạn không cần làm gì thêm. Bước tiếp theo là review bản phát hành.${audit(["commit 129c27a9a", "38/38 tests passed"])}`,
  },
  {
    id: "blocked",
    outcome: "Phần đã triển khai vẫn hoạt động",
    health: "Chưa có bằng chứng hệ thống bị hỏng",
    action: "Lan cần cấp quyền push trong GitHub Environment",
    nextStep: "Sau khi Lan trả lời đã cấp quyền, TaskAgent sẽ push lại",
    owner: "Lan",
    evidence: ["blocker reason: credential_missing", "scope: current_track"],
    output: `Phần đã triển khai vẫn hoạt động. Chưa có bằng chứng hệ thống bị hỏng. Lan cần cấp quyền push trong GitHub Environment. Sau khi Lan trả lời đã cấp quyền, TaskAgent sẽ push lại.${audit(["blocker reason: credential_missing", "scope: current_track"])}`,
  },
  {
    id: "approval_needed",
    outcome: "Bản phát hành đã sẵn sàng để phê duyệt",
    health: "Không phát hiện lỗi trong các kiểm tra đã chạy",
    action: "Approver cần chọn Approve hoặc Request changes trên PR #2",
    nextStep: "Sau khi được duyệt, release ring nội bộ sẽ được cập nhật",
    owner: "Approver",
    evidence: ["PR #2", "release gate: pending approval"],
    output: `Bản phát hành đã sẵn sàng để phê duyệt. Không phát hiện lỗi trong các kiểm tra đã chạy. Approver cần chọn Approve hoặc Request changes trên PR #2. Sau khi được duyệt, release ring nội bộ sẽ được cập nhật.${audit(["PR #2", "release gate: pending approval"])}`,
  },
  {
    id: "user_action_needed",
    outcome: "TaskAgent đã hoàn tất phần tự động",
    health: "Không có lỗi kỹ thuật được ghi nhận",
    action: "Người dùng cần xác nhận tài khoản tại Runtime Access",
    nextStep: "Sau khi trả lời đã xác nhận, TaskAgent sẽ tiếp tục kiểm tra",
    owner: "Người dùng",
    evidence: ["interaction ID: user-confirm-17"],
    output: `TaskAgent đã hoàn tất phần tự động. Không có lỗi kỹ thuật được ghi nhận. Người dùng cần xác nhận tài khoản tại Runtime Access. Sau khi trả lời đã xác nhận, TaskAgent sẽ tiếp tục kiểm tra.${audit(["interaction ID: user-confirm-17"])}`,
  },
  {
    id: "technical_failure",
    outcome: "Bản build chưa hoàn tất",
    health: "API hiện tại vẫn phục vụ bình thường; lỗi chỉ ảnh hưởng build mới",
    action: "Developer cần sửa lỗi TypeScript trong output-policy.ts",
    nextStep: "Chạy lại typecheck và build sau khi sửa",
    owner: "Developer",
    evidence: ["verification: failed", "TS2322 at output-policy.ts:42"],
    output: `Bản build chưa hoàn tất. API hiện tại vẫn phục vụ bình thường; lỗi chỉ ảnh hưởng build mới. Developer cần sửa lỗi TypeScript trong output-policy.ts. Chạy lại typecheck và build sau khi sửa.${audit(["verification: failed", "TS2322 at output-policy.ts:42"])}`,
  },
  {
    id: "review_changes",
    outcome: "Review chưa chấp nhận bản hiện tại",
    health: "Không có bằng chứng phần ngoài phạm vi review bị lỗi",
    action: "Runtime Engineer cần bổ sung behavioral eval và pilot kit",
    nextStep: "Gửi lại commit và verification để reviewer đánh giá",
    owner: "Runtime Engineer",
    evidence: ["review: REQUEST CHANGES", "PR #2"],
    output: `Review chưa chấp nhận bản hiện tại. Không có bằng chứng phần ngoài phạm vi review bị lỗi. Runtime Engineer cần bổ sung behavioral eval và pilot kit. Gửi lại commit và verification để reviewer đánh giá.${audit(["review: REQUEST CHANGES", "PR #2"])}`,
  },
  {
    id: "handoff",
    outcome: "Phần runtime đã hoàn tất và được bàn giao",
    health: "Không ghi nhận lỗi mới",
    action: "Integration Reviewer cần kiểm tra PR #2",
    nextStep: "Sau verdict, squad sẽ quyết định release ring",
    owner: "Integration Reviewer",
    evidence: ["handoff commit: 129c27a9a", "PR #2"],
    output: `Phần runtime đã hoàn tất và được bàn giao. Không ghi nhận lỗi mới. Integration Reviewer cần kiểm tra PR #2. Sau verdict, squad sẽ quyết định release ring.${audit(["handoff commit: 129c27a9a", "PR #2"])}`,
  },
  {
    id: "9route_blocked",
    outcome: "Cổng 9route hiện vẫn hoạt động",
    health: "Chưa có bằng chứng 9route bị hỏng",
    action: "Quản trị viên cần xác nhận tài khoản triển khai tại Runtime Access",
    nextStep: "Sau khi trả lời đã xác nhận, TaskAgent sẽ chạy lại kiểm tra kết nối",
    owner: "Quản trị viên",
    evidence: ["probe ID: route-probe-91", "ledger receipt: ledger-247"],
    forbiddenOpeningTerms: ["heartbeat", "capability gate", "identity binding"],
    output: `Cổng 9route hiện vẫn hoạt động. Chưa có bằng chứng 9route bị hỏng. Quản trị viên cần xác nhận tài khoản triển khai tại Runtime Access. Sau khi trả lời đã xác nhận, TaskAgent sẽ chạy lại kiểm tra kết nối.${audit(["probe ID: route-probe-91", "ledger receipt: ledger-247", "internal reason: identity binding/capability gate"])}`,
  },
  {
    id: "failed_verification",
    outcome: "Thay đổi chưa đạt kiểm tra bắt buộc",
    health: "Lỗi được xác nhận trong behavioral test; production chưa bị thay đổi",
    action: "Developer cần sửa output thiếu owner/action",
    nextStep: "Chạy lại đúng test đã thất bại trước khi review",
    owner: "Developer",
    evidence: ["verification status: failed", "test: blocked output names owner/action"],
    output: `Thay đổi chưa đạt kiểm tra bắt buộc. Lỗi được xác nhận trong behavioral test; production chưa bị thay đổi. Developer cần sửa output thiếu owner/action. Chạy lại đúng test đã thất bại trước khi review.${audit(["verification status: failed", "test: blocked output names owner/action"])}`,
  },
  {
    id: "not_run_verification",
    outcome: "Phần code đã hoàn tất nhưng chưa có verdict Rust",
    health: "Không có bằng chứng Rust bị lỗi vì kiểm tra chưa chạy được",
    action: "Operator cần chạy cargo test trong runner có Rust toolchain",
    nextStep: "Gửi lại kết quả cargo test để hoàn tất verification",
    owner: "Operator",
    evidence: ["verification status: not_run", "reasonCode: tool_unavailable"],
    output: `Phần code đã hoàn tất nhưng chưa có verdict Rust. Không có bằng chứng Rust bị lỗi vì kiểm tra chưa chạy được. Operator cần chạy cargo test trong runner có Rust toolchain. Gửi lại kết quả cargo test để hoàn tất verification.${audit(["verification status: not_run", "reasonCode: tool_unavailable"])}`,
  },
];

export function evaluateTaskOutputGolden(fixture: TaskOutputGolden): string[] {
  const errors: string[] = [];
  for (const [label, value] of [
    ["outcome", fixture.outcome],
    ["health statement", fixture.health],
    ["required action", fixture.action],
    ["next step", fixture.nextStep],
  ] as const) {
    if (!fixture.output.includes(value)) errors.push(`missing ${label}`);
  }
  if (fixture.owner && !fixture.output.includes(fixture.owner)) errors.push("missing action owner");
  if (!fixture.output.includes(fixture.action)) errors.push("missing required action");
  if (!fixture.output.includes("Audit details")) errors.push("missing audit details");
  for (const evidence of fixture.evidence) {
    if (!fixture.output.includes(evidence)) errors.push(`missing audit evidence: ${evidence}`);
  }
  const opening = fixture.output.split("Audit details", 1)[0]!.toLowerCase();
  const outcomeIndex = opening.indexOf(fixture.outcome.toLowerCase());
  if (fixture.forbiddenOpeningTerms?.some((term) => {
    const termIndex = opening.indexOf(term.toLowerCase());
    return termIndex >= 0 && (outcomeIndex < 0 || termIndex < outcomeIndex);
  })) {
    errors.push("internal terminology appears before the plain-language opening");
  }
  return [...new Set(errors)];
}
