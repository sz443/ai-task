import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import type { TaskDTO } from "@/types";

const runRoleLabelMap: Record<string, string> = {
  DISPATCHER: "策略分析",
  FRONTEND: "执行工程师",
  QA: "质量验证",
  REVIEWER: "交付审查",
};

export function ExecutionSummaryCard({ task }: { task: TaskDTO }) {
  const latestRun = task.agentRuns[task.agentRuns.length - 1];
  const totalLogs = task.agentRuns.reduce(
    (acc, run) => acc + run.commandLogs.length,
    0,
  );

  return (
    <section className="grid gap-4 rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:grid-cols-4">
      <div className="rounded-2xl bg-slate-50/90 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          当前状态
        </p>
        <div className="mt-3">
          <TaskStatusBadge status={task.status} />
        </div>
      </div>
      <div className="rounded-2xl bg-slate-50/90 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          执行阶段数
        </p>
        <p className="mt-3 text-3xl font-semibold">{task.agentRuns.length}</p>
      </div>
      <div className="rounded-2xl bg-slate-50/90 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          校验日志数
        </p>
        <p className="mt-3 text-3xl font-semibold">{totalLogs}</p>
      </div>
      <div className="rounded-2xl bg-slate-50/90 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          最新进度
        </p>
        <p className="mt-3 text-sm font-medium text-slate-900">
          {latestRun
            ? runRoleLabelMap[latestRun.role] || latestRun.role
            : "尚未触发任何 Agent"}
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {latestRun ? latestRun.status : "等待进入执行流程"}
        </p>
      </div>
    </section>
  );
}
