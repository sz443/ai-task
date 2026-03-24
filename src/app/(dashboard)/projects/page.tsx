import Link from "next/link";
import { connection } from "next/server";

import { RouteAutoRefresh } from "@/components/common/route-auto-refresh";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { ProjectTable } from "@/components/projects/project-table";
import { Button } from "@/components/ui/button";
import { appEnv } from "@/lib/env";
import { getLiveRouteRefreshIntervalMs } from "@/lib/live-updates";
import { listProjects } from "@/server/repositories/projects";

export default async function ProjectsPage() {
  await connection();
  const refreshIntervalMs = getLiveRouteRefreshIntervalMs(
    appEnv.taskPollerIntervalMs,
  );
  const projects = await listProjects();
  const totalTasks = projects.reduce(
    (acc, project) => acc + project.taskCount,
    0,
  );

  return (
    <>
      <RouteAutoRefresh intervalMs={refreshIntervalMs} />
      <PageHeader
        eyebrow="Projects"
        title="项目列表"
        description="统一管理接入仓库、执行边界与验证策略，为任务调度、代码修改与交付审核提供可靠基线。"
        actions={
          <Button asChild>
            <Link href="/projects/new">新建项目</Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="项目数"
          value={projects.length}
          hint="统一纳管多个研发仓库"
        />
        <StatCard
          label="任务总数"
          value={totalTasks}
          hint="跨项目执行数据总览"
        />
        <StatCard
          label="自动交付策略"
          value="关闭"
          hint="默认保持人工可控的发布边界"
        />
      </section>

      {projects.length === 0 ? (
        <EmptyState
          title="尚未接入任何项目"
          description="先接入一个本地仓库，系统才能为该项目分派任务、执行代码修改、完成验证并沉淀交付记录。"
          action={
            <Button asChild>
              <Link href="/projects/new">创建第一个项目</Link>
            </Button>
          }
        />
      ) : (
        <ProjectTable projects={projects} />
      )}
    </>
  );
}
