"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createTaskAction, updateTaskAction } from "@/actions/task-actions";
import { Button } from "@/components/ui/button";
import { taskFormSchema, type TaskFormInput } from "@/features/tasks/schema";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TYPES,
  type TaskDTO,
} from "@/types";

const defaultValues: TaskFormInput = {
  projectId: "",
  title: "",
  description: "",
  type: "BUG",
  priority: "MEDIUM",
  status: "TODO",
  acceptanceCriteriaText: "",
  allowedPathsText: "",
  forbiddenPathsText: "",
  notes: "",
};

function mapTaskToValues(task?: Partial<TaskDTO>): TaskFormInput {
  if (!task) {
    return defaultValues;
  }

  return {
    projectId: task.projectId || "",
    title: task.title || "",
    description: task.description || "",
    type: task.type || "BUG",
    priority: task.priority || "MEDIUM",
    status: task.status || "TODO",
    acceptanceCriteriaText: (task.acceptanceCriteria || [])
      .map((item) => item.content)
      .join("\n"),
    allowedPathsText: (task.allowedPaths || []).join("\n"),
    forbiddenPathsText: (task.forbiddenPaths || []).join("\n"),
    notes: task.notes || "",
  };
}

export function TaskForm({
  mode,
  task,
  projectOptions,
}: {
  mode: "create" | "edit";
  task?: Partial<TaskDTO> & { id?: string };
  projectOptions: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormInput>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: mapTaskToValues(task),
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createTaskAction(values)
          : await updateTaskAction(task?.id || "", values);

      if (result.success && result.data) {
        router.push(`/tasks/${result.data.id}`);
        router.refresh();
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="grid gap-6 rounded-3xl border border-border bg-white/80 p-6 shadow-sm md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">所属项目</label>
          <select
            {...register("projectId")}
            className="w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-sky-500"
          >
            <option value="">请选择项目</option>
            {projectOptions.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {errors.projectId ? (
            <p className="text-xs text-destructive">
              {errors.projectId.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">任务标题</label>
          <input
            {...register("title")}
            placeholder="修复首页筛选器状态错乱"
            className="w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-sky-500"
          />
          {errors.title ? (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          ) : null}
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">任务描述</label>
          <textarea
            {...register("description")}
            rows={5}
            placeholder="请描述现象、复现步骤、预期结果和上下文。"
            className="w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-sky-500"
          />
          {errors.description ? (
            <p className="text-xs text-destructive">
              {errors.description.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">任务类型</label>
          <select
            {...register("type")}
            className="w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-sky-500"
          >
            {TASK_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">优先级</label>
          <select
            {...register("priority")}
            className="w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-sky-500"
          >
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">初始状态</label>
          <select
            {...register("status")}
            className="w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-sky-500"
          >
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">验收标准（可留空）</label>
          <textarea
            {...register("acceptanceCriteriaText")}
            rows={5}
            placeholder={"支持换行，一行一条；如果暂时没有，可以留空"}
            className="w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-sky-500"
          />
          <p className="text-xs text-muted-foreground">
            没写也可以，后续 agent 会按任务标题、描述和项目上下文继续执行。
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">允许修改范围（可留空）</label>
          <textarea
            {...register("allowedPathsText")}
            rows={5}
            placeholder={"留空表示继承项目规则：只要不在禁止范围内都可修改"}
            className="w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-sky-500"
          />
          <p className="text-xs text-muted-foreground">
            通常不需要再单独限制允许范围；只有想额外缩小本次任务可改目录时才填写。
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">禁止修改范围</label>
          <textarea
            {...register("forbiddenPathsText")}
            rows={5}
            placeholder={"prisma\n.env"}
            className="w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-sky-500"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">备注</label>
          <textarea
            {...register("notes")}
            rows={4}
            placeholder="可以写给 dispatcher 的额外提醒。"
            className="w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-sky-500"
          />
        </div>
      </section>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          取消
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "提交中..."
            : mode === "create"
              ? "创建任务"
              : "保存任务"}
        </Button>
      </div>
    </form>
  );
}
