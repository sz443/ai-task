"use client";

import { ProjectDeleteButton } from "@/components/projects/project-delete-button";

export function ProjectDangerZone({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  return (
    <section className="rounded-3xl border border-destructive/30 bg-red-50/70 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-destructive">删除项目</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        删除项目会同步移除该项目下的任务、执行记录、命令日志和产物，请在确认无需保留相关数据后再执行。
      </p>
      <div className="mt-4">
        <ProjectDeleteButton projectId={projectId} projectName={projectName} />
      </div>
    </section>
  );
}
