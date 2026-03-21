import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { TaskDTO } from "@/types";
import { TaskDeleteButton } from "@/components/tasks/task-delete-button";

import { PriorityBadge } from "./priority-badge";
import { TaskStatusBadge } from "./task-status-badge";

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

export function TaskTable({ tasks }: { tasks: TaskDTO[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-white/85 shadow-sm">
      <table className="min-w-full divide-y divide-border text-left text-sm">
        <thead className="bg-slate-50/70 text-muted-foreground">
          <tr>
            <th className="px-5 py-4 font-medium">任务</th>
            <th className="px-5 py-4 font-medium">项目</th>
            <th className="px-5 py-4 font-medium">类型</th>
            <th className="px-5 py-4 font-medium">优先级</th>
            <th className="px-5 py-4 font-medium">状态</th>
            <th className="px-5 py-4 font-medium">最近执行</th>
            <th className="w-[220px] px-5 py-4 font-medium text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {tasks.map((task) => {
            const latestRun = task.agentRuns[task.agentRuns.length - 1];
            const executionText = task.currentAgentRole
              ? `当前阶段：${runRoleLabelMap[task.currentAgentRole] || task.currentAgentRole}`
              : latestRun
                ? `最近阶段：${runRoleLabelMap[latestRun.role] || latestRun.role} / ${latestRun.status}`
                : task.status === "TODO"
                  ? "尚未执行"
                  : "已进入流程";

            return (
              <tr key={task.id} className="hover:bg-slate-50/60">
                <td className="px-5 py-4 align-top">
                  <div className="space-y-2">
                    <p className="font-medium">
                      #{task.sequence} {task.title}
                    </p>
                    <p className="max-w-md text-xs leading-5 text-muted-foreground">
                      {task.description}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-4 align-top">{task.projectName}</td>
                <td className="px-5 py-4 align-top">
                  {taskTypeLabelMap[task.type] || task.type}
                </td>
                <td className="px-5 py-4 align-top">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="px-5 py-4 align-top">
                  <TaskStatusBadge status={task.status} />
                </td>
                <td className="px-5 py-4 align-top text-xs text-muted-foreground">
                  {executionText}
                </td>
                <td className="w-[220px] px-5 py-4 align-top">
                  <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                    <Button
                      asChild
                      size="sm"
                      className="min-w-[96px] justify-center"
                    >
                      <Link href={`/tasks/${task.id}`}>打开</Link>
                    </Button>
                    <TaskDeleteButton taskId={task.id} taskTitle={task.title} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
