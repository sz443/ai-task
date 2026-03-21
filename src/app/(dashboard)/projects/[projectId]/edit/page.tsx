import { notFound } from "next/navigation";

import { PageHeader } from "@/components/common/page-header";
import { ProjectForm } from "@/components/projects/project-form";
import { getProjectById } from "@/server/repositories/projects";

export default async function EditProjectPage({
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
      <PageHeader eyebrow="Projects" title={`编辑 ${project.name}`} description="更新路径策略、命令和 Agent 运行配置。" />
      <ProjectForm mode="edit" project={project} />
    </>
  );
}
