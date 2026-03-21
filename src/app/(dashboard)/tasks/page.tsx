import Link from "next/link";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { TaskTable } from "@/components/tasks/task-table";
import { Button } from "@/components/ui/button";
import { listTasks } from "@/server/repositories/tasks";

export default async function TasksPage() {
  const tasks = await listTasks();
  const awaitingApproval = tasks.filter(
    (task) => task.status === "AWAITING_HUMAN_APPROVAL",
  ).length;
  const failedTasks = tasks.filter((task) => task.status === "FAILED").length;

  return (
    <>
      <PageHeader
        eyebrow="Tasks"
        title="任务中心"
        description="统一管理需求、缺陷与交付事项，并自动驱动策略分析、执行、验证与审查流程。"
        actions={
          <Button asChild>
            <Link href="/tasks/new">创建任务</Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="任务总数"
          value={tasks.length}
          hint="覆盖全部项目与执行链路"
        />
        <StatCard
          label="待确认"
          value={awaitingApproval}
          hint="等待补充决策或业务确认"
        />
        <StatCard
          label="需关注"
          value={failedTasks}
          hint="建议优先处理当前执行异常"
        />
      </section>

      {tasks.length === 0 ? (
        <EmptyState
          title="尚未创建任何任务"
          description="为已接入项目创建第一条任务后，系统会自动推进分析、执行、验证与审查流程。"
          action={
            <Button asChild>
              <Link href="/tasks/new">创建首个任务</Link>
            </Button>
          }
        />
      ) : (
        <TaskTable tasks={tasks} />
      )}
    </>
  );
}
