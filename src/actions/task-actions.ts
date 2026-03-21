"use server";

import { revalidatePath } from "next/cache";

import { approvalFormSchema, taskFormSchema } from "@/features/tasks/schema";
import {
  approveTask,
  createTask,
  deleteTask,
  updateTask,
} from "@/server/repositories/tasks";
import { runTaskOrchestration } from "@/server/orchestrator/task-orchestrator";
import type { ActionResponse, TaskDTO } from "@/types";

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch (error) {
    console.warn(`[revalidatePath] failed for ${path}`, error);
  }
}

export async function createTaskAction(
  input: unknown,
): Promise<ActionResponse<TaskDTO>> {
  const parsed = taskFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: "任务表单校验失败",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const task = await createTask(parsed.data);
    safeRevalidatePath("/tasks");
    safeRevalidatePath(`/projects/${task.projectId}`);
    return { success: true, data: task };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "创建任务失败",
      },
    };
  }
}

export async function updateTaskAction(
  taskId: string,
  input: unknown,
): Promise<ActionResponse<TaskDTO>> {
  const parsed = taskFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: "任务表单校验失败",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const task = await updateTask(taskId, parsed.data);
    safeRevalidatePath("/tasks");
    safeRevalidatePath(`/tasks/${taskId}`);
    return { success: true, data: task };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "更新任务失败",
      },
    };
  }
}

export async function startTaskExecutionAction(
  taskId: string,
): Promise<ActionResponse<TaskDTO | null>> {
  try {
    const task = await runTaskOrchestration(taskId);
    safeRevalidatePath("/tasks");
    safeRevalidatePath(`/tasks/${taskId}`);
    return { success: true, data: task || undefined };
  } catch (error) {
    safeRevalidatePath("/tasks");
    safeRevalidatePath(`/tasks/${taskId}`);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "任务执行失败",
      },
    };
  }
}

export async function approveTaskAction(
  taskId: string,
  input: unknown,
): Promise<ActionResponse<TaskDTO | null>> {
  const parsed = approvalFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: "审批表单校验失败",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const task = await approveTask(taskId, parsed.data);
    safeRevalidatePath("/tasks");
    safeRevalidatePath(`/tasks/${taskId}`);
    return { success: true, data: task || undefined };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "审批任务失败",
      },
    };
  }
}

export async function deleteTaskAction(
  taskId: string,
): Promise<ActionResponse<{ id: string }>> {
  try {
    await deleteTask(taskId);
    safeRevalidatePath("/tasks");
    return { success: true, data: { id: taskId } };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "删除任务失败",
      },
    };
  }
}
