"use client";

import { deleteTaskAction } from "@/actions/task-actions";
import { DeleteEntryButton } from "@/components/common/delete-entry-button";

export function TaskDeleteButton({
  taskId,
  taskTitle,
}: {
  taskId: string;
  taskTitle: string;
}) {
  return (
    <DeleteEntryButton
      label="删除任务"
      confirmText={`确认删除任务“${taskTitle}”吗？该操作不可恢复。`}
      redirectTo="/tasks"
      onDelete={() => deleteTaskAction(taskId)}
      size="sm"
    />
  );
}
