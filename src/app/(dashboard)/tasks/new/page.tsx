import { connection } from "next/server";

import { PageHeader } from "@/components/common/page-header";
import { TaskForm } from "@/components/tasks/task-form";
import { listProjects } from "@/server/repositories/projects";

export default async function NewTaskPage() {
  await connection();
  const projects = await listProjects();

  return (
    <>
      <PageHeader
        eyebrow="Tasks"
        title="新建任务"
        description="支持创建 bug / feature / chore / refactor / test-task，并附带验收标准与可修改范围。"
      />
      <TaskForm
        mode="create"
        projectOptions={projects.map((project) => ({
          id: project.id,
          name: project.name,
        }))}
      />
    </>
  );
}
