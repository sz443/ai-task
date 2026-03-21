import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/common/page-header";
import { ProjectDangerZone } from "@/components/projects/project-danger-zone";
import { StatCard } from "@/components/common/stat-card";
import { Button } from "@/components/ui/button";
import { getProjectById } from "@/server/repositories/projects";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);

  if (!project) {
    notFound();
  }

  return (
    <>
      <PageHeader
        eyebrow="Project Detail"
        title={project.name}
        description={project.description || "当前项目尚未补充描述。"}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/tasks/new">新建任务</Link>
            </Button>
            <Button asChild>
              <Link href={`/projects/${project.id}/edit`}>编辑项目</Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="仓库路径"
          value={project.repoPath}
          valueClassName="break-all text-xl leading-8 sm:text-2xl"
        />
        <StatCard label="默认分支" value={project.defaultBranch} />
        <StatCard label="任务数" value={project.taskCount} />
        <StatCard
          label="运行时"
          value={project.executionConfig?.runtimeKind || "MOCK"}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-border bg-white/85 p-6 shadow-sm">
          <h3 className="text-lg font-semibold">仓库执行配置</h3>
          <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">允许修改目录</dt>
              <dd className="mt-2 whitespace-pre-wrap rounded-2xl bg-slate-50 p-3">
                {project.allowedPaths.join("\n") ||
                  "未限制（除禁止范围外均可修改）"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">禁止修改目录</dt>
              <dd className="mt-2 whitespace-pre-wrap rounded-2xl bg-slate-50 p-3">
                {project.forbiddenPaths.join("\n") || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Lint</dt>
              <dd className="mt-2 rounded-2xl bg-slate-50 p-3">
                {project.lintCommand || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Typecheck</dt>
              <dd className="mt-2 rounded-2xl bg-slate-50 p-3">
                {project.typecheckCommand || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Test</dt>
              <dd className="mt-2 rounded-2xl bg-slate-50 p-3">
                {project.testCommand || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Build</dt>
              <dd className="mt-2 rounded-2xl bg-slate-50 p-3">
                {project.buildCommand || "-"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-3xl border border-border bg-white/85 p-6 shadow-sm">
          <h3 className="text-lg font-semibold">最近任务</h3>
          <div className="mt-4 space-y-3">
            {project.recentTasks.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                当前项目还没有任务。
              </p>
            ) : (
              project.recentTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="block rounded-2xl border border-border p-4 transition hover:bg-slate-50"
                >
                  <p className="font-medium">{task.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {task.status} / {task.priority}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <ProjectDangerZone projectId={project.id} projectName={project.name} />
    </>
  );
}
