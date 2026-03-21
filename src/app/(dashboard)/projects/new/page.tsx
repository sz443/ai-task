import { PageHeader } from "@/components/common/page-header";
import { ProjectForm } from "@/components/projects/project-form";

export default function NewProjectPage() {
  return (
    <>
      <PageHeader
        eyebrow="Projects"
        title="新建项目"
        description="为本地仓库建立执行配置，包括路径、分支、命令和可修改范围。"
      />
      <ProjectForm mode="create" />
    </>
  );
}
