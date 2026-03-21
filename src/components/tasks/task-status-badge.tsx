import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types";

const statusLabelMap: Record<TaskStatus, string> = {
  TODO: "待启动",
  DISPATCHING: "策略分析中",
  IN_PROGRESS_FRONTEND: "执行处理中",
  READY_FOR_QA: "等待验证",
  IN_PROGRESS_QA: "验证进行中",
  IN_REVIEW: "审查进行中",
  AWAITING_HUMAN_APPROVAL: "等待确认",
  APPROVED: "已确认",
  REJECTED: "未通过",
  DONE: "已交付",
  FAILED: "执行失败",
  BLOCKED: "待处理",
};

const statusClassMap: Record<TaskStatus, string> = {
  TODO: "bg-slate-100 text-slate-700",
  DISPATCHING: "bg-amber-100 text-amber-700",
  IN_PROGRESS_FRONTEND: "bg-sky-100 text-sky-700",
  READY_FOR_QA: "bg-cyan-100 text-cyan-700",
  IN_PROGRESS_QA: "bg-teal-100 text-teal-700",
  IN_REVIEW: "bg-indigo-100 text-indigo-700",
  AWAITING_HUMAN_APPROVAL: "bg-violet-100 text-violet-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  DONE: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-700",
  BLOCKED: "bg-orange-100 text-orange-700",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-medium",
        statusClassMap[status],
      )}
    >
      {statusLabelMap[status]}
    </span>
  );
}
