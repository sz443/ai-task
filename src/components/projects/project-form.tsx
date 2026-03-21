"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createProjectAction,
  updateProjectAction,
} from "@/actions/project-actions";
import { Button } from "@/components/ui/button";
import {
  projectFormSchema,
  type ProjectFormInput,
} from "@/features/projects/schema";
import type { ProjectDTO } from "@/types";

import { CommandConfigSection } from "./command-config-section";
import { RepoPathField } from "./repo-path-field";

const defaultValues: ProjectFormInput = {
  name: "",
  slug: "",
  description: "",
  repoPath: "",
  defaultBranch: "main",
  allowedPathsText: "",
  forbiddenPathsText: ".env\nnode_modules\ndist",
  lintCommand: "",
  typecheckCommand: "",
  testCommand: "",
  buildCommand: "",
  autoCommitEnabled: false,
  autoPushEnabled: false,
};

function mapProjectToValues(project?: Partial<ProjectDTO>): ProjectFormInput {
  if (!project) {
    return defaultValues;
  }

  return {
    name: project.name || "",
    slug: project.slug || "",
    description: project.description || "",
    repoPath: project.repoPath || "",
    defaultBranch: project.defaultBranch || "main",
    allowedPathsText: (project.allowedPaths || []).join("\n"),
    forbiddenPathsText: (project.forbiddenPaths || []).join("\n"),
    lintCommand: project.lintCommand || "",
    typecheckCommand: project.typecheckCommand || "",
    testCommand: project.testCommand || "",
    buildCommand: project.buildCommand || "",
    autoCommitEnabled: project.autoCommitEnabled || false,
    autoPushEnabled: project.autoPushEnabled || false,
  };
}

export function ProjectForm({
  mode,
  project,
}: {
  mode: "create" | "edit";
  project?: Partial<ProjectDTO> & { id?: string };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormInput>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: mapProjectToValues(project),
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createProjectAction(values)
          : await updateProjectAction(project?.id || "", values);

      if (result.success && result.data) {
        router.push(
          mode === "create"
            ? `/projects/${result.data.id}`
            : `/projects/${project?.id}`,
        );
        router.refresh();
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="grid gap-6 rounded-3xl border border-border bg-white/80 p-6 shadow-sm md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">项目名称</label>
          <input
            {...register("name")}
            placeholder="funhub-web"
            className="w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-sky-500"
          />
          {errors.name ? (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">项目标识</label>
          <input
            {...register("slug")}
            placeholder="funhub-web"
            className="w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-sky-500"
          />
          {errors.slug ? (
            <p className="text-xs text-destructive">{errors.slug.message}</p>
          ) : null}
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">项目说明</label>
          <textarea
            {...register("description")}
            rows={4}
            placeholder="描述项目作用、技术栈或 Agent 注意事项"
            className="w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-sky-500"
          />
        </div>
        <div className="md:col-span-2">
          <RepoPathField
            inputProps={register("repoPath")}
            error={errors.repoPath?.message}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">默认分支</label>
          <input
            {...register("defaultBranch")}
            placeholder="main"
            className="w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-sky-500"
          />
          {errors.defaultBranch ? (
            <p className="text-xs text-destructive">
              {errors.defaultBranch.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">
            允许 AI 修改目录（可留空）
          </label>
          <textarea
            {...register("allowedPathsText")}
            rows={4}
            placeholder={"留空表示只要不在禁止范围内，整个仓库都可修改"}
            className="w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-sky-500"
          />
          <p className="text-xs text-muted-foreground">
            已填写本地仓库路径时，留空即可表示默认允许修改仓库内未被禁止的文件。
          </p>
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">禁止 AI 修改目录</label>
          <textarea
            {...register("forbiddenPathsText")}
            rows={4}
            placeholder={".env\nnode_modules\ndist"}
            className="w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-sky-500"
          />
        </div>
      </section>

      <CommandConfigSection
        fields={{
          lintCommand: register("lintCommand"),
          typecheckCommand: register("typecheckCommand"),
          testCommand: register("testCommand"),
          buildCommand: register("buildCommand"),
        }}
        errors={{
          lintCommand: errors.lintCommand?.message,
          typecheckCommand: errors.typecheckCommand?.message,
          testCommand: errors.testCommand?.message,
          buildCommand: errors.buildCommand?.message,
        }}
      />

      <section className="grid gap-4 rounded-3xl border border-border bg-white/80 p-6 shadow-sm md:grid-cols-2">
        <label className="flex items-start gap-3 rounded-2xl border border-border p-4">
          <input
            type="checkbox"
            {...register("autoCommitEnabled")}
            className="mt-1 size-4"
          />
          <span>
            <span className="block font-medium">允许自动 commit</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              默认关闭，建议在验证稳定的仓库中按需开启。
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 rounded-2xl border border-border p-4">
          <input
            type="checkbox"
            {...register("autoPushEnabled")}
            className="mt-1 size-4"
          />
          <span>
            <span className="block font-medium">允许自动 push</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              默认关闭，建议仅在已建立审查与发布流程的环境中开启。
            </span>
          </span>
        </label>
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          取消
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "提交中..."
            : mode === "create"
              ? "创建项目"
              : "保存项目"}
        </Button>
      </div>
    </form>
  );
}
