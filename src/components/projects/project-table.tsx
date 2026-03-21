import Link from "next/link";

import { FolderGit2 } from "lucide-react";

import { ProjectDeleteButton } from "@/components/projects/project-delete-button";
import { Button } from "@/components/ui/button";
import type { ProjectDTO } from "@/types";

export function ProjectTable({ projects }: { projects: ProjectDTO[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-white/85 shadow-sm">
      <table className="min-w-full divide-y divide-border text-left text-sm">
        <thead className="bg-slate-50/70 text-muted-foreground">
          <tr>
            <th className="px-5 py-4 font-medium">项目</th>
            <th className="px-5 py-4 font-medium">仓库路径</th>
            <th className="px-5 py-4 font-medium">默认分支</th>
            <th className="px-5 py-4 font-medium">任务数</th>
            <th className="px-5 py-4 font-medium">自动策略</th>
            <th className="w-[220px] px-5 py-4 font-medium text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {projects.map((project) => (
            <tr key={project.id} className="hover:bg-slate-50/60">
              <td className="px-5 py-4 align-top">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-sky-100 p-2 text-sky-700">
                    <FolderGit2 className="size-4" />
                  </div>
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {project.slug}
                    </p>
                    {project.description ? (
                      <p className="mt-2 max-w-sm text-xs text-muted-foreground">
                        {project.description}
                      </p>
                    ) : null}
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 align-top">
                <code className="rounded bg-slate-100 px-2 py-1 text-xs">
                  {project.repoPath}
                </code>
              </td>
              <td className="px-5 py-4 align-top">{project.defaultBranch}</td>
              <td className="px-5 py-4 align-top">{project.taskCount}</td>
              <td className="px-5 py-4 align-top text-xs text-muted-foreground">
                <div>commit: {project.autoCommitEnabled ? "on" : "off"}</div>
                <div>push: {project.autoPushEnabled ? "on" : "off"}</div>
              </td>
              <td className="w-[220px] px-5 py-4 align-top">
                <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="min-w-[96px] justify-center"
                  >
                    <Link href={`/projects/${project.id}`}>打开</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="min-w-[96px] justify-center"
                  >
                    <Link href={`/projects/${project.id}/edit`}>配置</Link>
                  </Button>
                  <ProjectDeleteButton
                    projectId={project.id}
                    projectName={project.name}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
