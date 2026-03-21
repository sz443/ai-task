"use client";

import { deleteProjectAction } from "@/actions/project-actions";
import { DeleteEntryButton } from "@/components/common/delete-entry-button";

export function ProjectDeleteButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  return (
    <DeleteEntryButton
      label="删除项目"
      confirmText={`确认删除项目“${projectName}”吗？该操作不可恢复。`}
      redirectTo="/projects"
      onDelete={() => deleteProjectAction(projectId)}
      size="sm"
    />
  );
}
