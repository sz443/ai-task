"use server";

import { revalidatePath } from "next/cache";

import { projectFormSchema } from "@/features/projects/schema";
import {
  createProject,
  deleteProject,
  updateProject,
} from "@/server/repositories/projects";
import type { ActionResponse, ProjectDTO } from "@/types";

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch (error) {
    console.warn(`[revalidatePath] failed for ${path}`, error);
  }
}

export async function createProjectAction(
  input: unknown,
): Promise<ActionResponse<ProjectDTO>> {
  const parsed = projectFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: "项目表单校验失败",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const project = await createProject(parsed.data);
    safeRevalidatePath("/projects");
    return { success: true, data: project };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "创建项目失败",
      },
    };
  }
}

export async function updateProjectAction(
  projectId: string,
  input: unknown,
): Promise<ActionResponse<ProjectDTO>> {
  const parsed = projectFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: "项目表单校验失败",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const project = await updateProject(projectId, parsed.data);
    safeRevalidatePath("/projects");
    safeRevalidatePath(`/projects/${projectId}`);
    return { success: true, data: project };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "更新项目失败",
      },
    };
  }
}

export async function deleteProjectAction(
  projectId: string,
): Promise<ActionResponse<{ id: string }>> {
  try {
    await deleteProject(projectId);
    safeRevalidatePath("/projects");
    return { success: true, data: { id: projectId } };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "删除项目失败",
      },
    };
  }
}
