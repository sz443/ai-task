"use client";

import { TaskDeleteButton } from "@/components/tasks/task-delete-button";

export function TaskDangerZone({
  taskId,
  taskTitle,
}: {
  taskId: string;
  taskTitle: string;
}) {
  return (
    <section className="rounded-3xl border border-destructive/30 bg-red-50/70 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-destructive">删除任务</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        删除任务会同步移除执行记录、命令日志、状态流转和产物，请在确认无需保留相关审计信息后再执行。
      </p>
      <div className="mt-4">
        <TaskDeleteButton taskId={taskId} taskTitle={taskTitle} />
      </div>
    </section>
  );
}
