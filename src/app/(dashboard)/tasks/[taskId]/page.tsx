import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/common/page-header";
import { AgentRunTimeline } from "@/components/execution/agent-run-timeline";
import { ApprovalActions } from "@/components/execution/approval-actions";
import { ArtifactPanel } from "@/components/execution/artifact-panel";
import { CommandLogPanel } from "@/components/execution/command-log-panel";
import { ExecutionSummaryCard } from "@/components/execution/execution-summary-card";
import { TaskDangerZone } from "@/components/tasks/task-danger-zone";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { getTaskById } from "@/server/repositories/tasks";

const runRoleLabelMap: Record<string, string> = {
  DISPATCHER: "策略分析",
  FRONTEND: "执行工程师",
  QA: "质量验证",
  REVIEWER: "交付审查",
};

const taskTypeLabelMap: Record<string, string> = {
  BUG: "缺陷修复",
  FEATURE: "功能需求",
  CHORE: "常规事项",
  REFACTOR: "重构优化",
  TEST_TASK: "验证任务",
};

const taskStatusLabelMap: Record<string, string> = {
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

const actorTypeLabelMap: Record<string, string> = {
  HUMAN: "人工操作",
  SYSTEM: "系统流程",
  AGENT: "智能执行",
};

const triggerLabelMap: Record<string, string> = {
  MANUAL_CREATE: "任务创建",
  MANUAL_UPDATE: "任务更新",
  DISPATCH_START: "启动分析",
  AGENT_PROGRESS: "流程推进",
  QA_COMPLETE: "验证完成",
  REVIEW_COMPLETE: "审查完成",
  HUMAN_APPROVED: "人工确认",
  HUMAN_REJECTED: "人工驳回",
  EXECUTION_FAILED: "执行异常",
  SYSTEM_SYNC: "系统同步",
};

const actorNameLabelMap: Record<string, string> = {
  "local-user": "当前用户",
  system: "系统",
  orchestrator: "调度引擎",
  "task-poller": "任务轮询器",
  dispatcher: "策略分析",
  frontend: "执行工程师",
  qa: "质量验证",
  reviewer: "交付审查",
};

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const task = await getTaskById(taskId);

  if (!task) {
    notFound();
  }

  const latestHistory = task.statusHistory[task.statusHistory.length - 1];
  const latestRun = task.agentRuns[task.agentRuns.length - 1];
  const dispatcherAttempts = task.agentRuns.filter(
    (run) => run.role === "DISPATCHER",
  ).length;
  const maxAutoAttempts = 3;
  const retryCount = Math.max(dispatcherAttempts - 1, 0);
  const remainingAutoRetries = Math.max(
    maxAutoAttempts - dispatcherAttempts,
    0,
  );
  const overviewItems = [
    { label: "所属项目", value: task.projectName, href: "/projects" },
    { label: "任务类型", value: taskTypeLabelMap[task.type] || task.type },
    {
      label: "当前阶段",
      value: task.currentAgentRole
        ? runRoleLabelMap[task.currentAgentRole] || task.currentAgentRole
        : "尚未启动",
    },
    {
      label: "创建时间",
      value: new Date(task.createdAt).toLocaleString("zh-CN"),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={`Task #${task.sequence}`}
        title={task.title}
        description={task.description}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <PriorityBadge priority={task.priority} />
            <TaskStatusBadge status={task.status} />
          </div>
        }
      />

      <section className="rounded-[24px] border border-amber-200/70 bg-[linear-gradient(135deg,rgba(255,251,235,0.95),rgba(255,255,255,0.92))] p-4 shadow-[0_16px_40px_rgba(245,158,11,0.12)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700/80">
              Auto Retry
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              当前已运行 {dispatcherAttempts} 轮，自动重试 {retryCount}{" "}
              次，系统最多执行 {maxAutoAttempts} 轮。
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 px-4 py-3 text-right shadow-sm ring-1 ring-amber-200/70">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              剩余自动重试
            </p>
            <p className="mt-1 text-2xl font-semibold text-amber-700">
              {remainingAutoRetries}
            </p>
          </div>
        </div>
      </section>

      <ExecutionSummaryCard task={task} />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(340px,0.72fr)]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(240,249,255,0.92))] shadow-[0_24px_60px_rgba(15,23,42,0.1)]">
            <div className="border-b border-slate-200/80 px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700/80">
                    Task Brief
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">
                    任务总览
                  </h3>
                </div>
                <div className="rounded-2xl bg-white/80 px-4 py-3 text-right shadow-sm ring-1 ring-slate-200/70">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    最近更新
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {latestHistory
                      ? new Date(latestHistory.createdAt).toLocaleString(
                          "zh-CN",
                        )
                      : new Date(task.updatedAt).toLocaleString("zh-CN")}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 px-6 py-6 md:grid-cols-2">
              {overviewItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl bg-white/80 p-4 ring-1 ring-slate-200/70"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {item.label}
                  </p>
                  <div className="mt-2 text-sm font-medium text-slate-900">
                    {item.href ? (
                      <Link href={item.href}>{item.value}</Link>
                    ) : (
                      item.value
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 border-t border-slate-200/80 px-6 py-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-slate-50/90 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  执行范围
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {task.allowedPaths.join("\n") ||
                    "未限制（除禁止范围外均可修改）"}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50/90 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  限制范围
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {task.forbiddenPaths.join("\n") || "-"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Acceptance
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  验收标准
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-muted-foreground">
                {task.acceptanceCriteria.length} 条
              </span>
            </div>
            {task.acceptanceCriteria.length > 0 ? (
              <ul className="mt-5 space-y-3 text-sm">
                {task.acceptanceCriteria.map((item, index) => (
                  <li
                    key={item.id}
                    className="flex gap-3 rounded-2xl bg-slate-50/90 p-4"
                  >
                    <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                      {index + 1}
                    </span>
                    <span className="leading-6 text-slate-700">
                      {item.content}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-muted-foreground">
                未填写，策略分析阶段会结合任务目标自动补充建议性验收标准。
              </p>
            )}
          </section>

          <AgentRunTimeline runs={task.agentRuns} />
          <CommandLogPanel runs={task.agentRuns} />
          <ArtifactPanel runs={task.agentRuns} taskArtifacts={task.artifacts} />

          <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Activity
                </p>
                <h3 className="mt-2 text-lg font-semibold">流转记录</h3>
              </div>
              <span className="text-xs text-muted-foreground">
                {task.statusHistory.length} 条记录
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {task.statusHistory.map((history, index) => (
                <div
                  key={history.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-medium text-slate-900">
                          {taskStatusLabelMap[history.fromStatus || ""] ||
                            history.fromStatus ||
                            "初始创建"}{" "}
                          →{" "}
                          {taskStatusLabelMap[history.toStatus] ||
                            history.toStatus}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(history.createdAt).toLocaleString("zh-CN")}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {actorTypeLabelMap[history.actorType] ||
                          history.actorType}{" "}
                        /{" "}
                        {actorNameLabelMap[history.actorName || ""] ||
                          history.actorName ||
                          "-"}{" "}
                        / {triggerLabelMap[history.trigger] || history.trigger}
                      </p>
                      {history.note ? (
                        <p className="mt-3 leading-6 text-slate-600">
                          {history.note}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.92))] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Overview
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">
              交付摘要
            </h3>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="rounded-2xl bg-slate-50/80 p-4">
                <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  当前状态
                </dt>
                <dd className="mt-2">
                  <TaskStatusBadge status={task.status} />
                </dd>
              </div>
              <div className="rounded-2xl bg-slate-50/80 p-4">
                <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  最新进度
                </dt>
                <dd className="mt-2 font-medium text-slate-900">
                  {latestRun
                    ? `${runRoleLabelMap[latestRun.role] || latestRun.role} / ${latestRun.status}`
                    : "尚未执行"}
                </dd>
              </div>
              <div className="rounded-2xl bg-slate-50/80 p-4">
                <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  开始时间
                </dt>
                <dd className="mt-2 font-medium text-slate-900">
                  {task.startedAt
                    ? new Date(task.startedAt).toLocaleString("zh-CN")
                    : "未开始"}
                </dd>
              </div>
              <div className="rounded-2xl bg-slate-50/80 p-4">
                <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  结束时间
                </dt>
                <dd className="mt-2 font-medium text-slate-900">
                  {task.completedAt
                    ? new Date(task.completedAt).toLocaleString("zh-CN")
                    : "进行中"}
                </dd>
              </div>
            </dl>
          </section>

          <ApprovalActions taskId={task.id} status={task.status} />
          <TaskDangerZone taskId={task.id} taskTitle={task.title} />
        </div>
      </section>
    </>
  );
}
