import type { ProjectFormValues } from "@/features/projects/schema";
import { appEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { normalizeRuntimeKind } from "@/server/agents/runtime-kind";
import { toProjectDTO } from "@/server/dto/mappers";
import type { ProjectDTO } from "@/types";

export async function listProjects(): Promise<ProjectDTO[]> {
  const projects = await prisma.project.findMany({
    orderBy: [{ updatedAt: "desc" }],
    include: {
      _count: {
        select: {
          tasks: true,
        },
      },
    },
  });

  return projects.map(toProjectDTO);
}

export async function getProjectById(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      _count: {
        select: { tasks: true },
      },
      executionConfig: true,
      tasks: {
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!project) {
    return null;
  }

  return {
    ...toProjectDTO(project),
    executionConfig: project.executionConfig,
    recentTasks: project.tasks,
  };
}

export async function createProject(input: ProjectFormValues) {
  const runtimeKind = normalizeRuntimeKind(appEnv.agentRuntimeKind);

  const project = await prisma.project.create({
    data: {
      ...input,
      description: input.description || null,
      allowedPathsText: input.allowedPathsText || null,
      forbiddenPathsText: input.forbiddenPathsText || null,
      lintCommand: input.lintCommand || null,
      typecheckCommand: input.typecheckCommand || null,
      testCommand: input.testCommand || null,
      buildCommand: input.buildCommand || null,
      createdBy: "local-user",
      updatedBy: "local-user",
      executionConfig: {
        create: {
          runtimeKind,
          runtimeBaseUrl:
            process.env.AGENT_RUNTIME_BASE_URL || "http://127.0.0.1:4100",
          allowAutoCommit: input.autoCommitEnabled,
          allowAutoPush: input.autoPushEnabled,
        },
      },
    },
    include: {
      _count: {
        select: { tasks: true },
      },
    },
  });

  return toProjectDTO(project);
}

export async function updateProject(
  projectId: string,
  input: ProjectFormValues,
) {
  const runtimeKind = normalizeRuntimeKind(appEnv.agentRuntimeKind);

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...input,
      description: input.description || null,
      allowedPathsText: input.allowedPathsText || null,
      forbiddenPathsText: input.forbiddenPathsText || null,
      lintCommand: input.lintCommand || null,
      typecheckCommand: input.typecheckCommand || null,
      testCommand: input.testCommand || null,
      buildCommand: input.buildCommand || null,
      updatedBy: "local-user",
      executionConfig: {
        upsert: {
          create: {
            runtimeKind,
            runtimeBaseUrl:
              process.env.AGENT_RUNTIME_BASE_URL || "http://127.0.0.1:4100",
            allowAutoCommit: input.autoCommitEnabled,
            allowAutoPush: input.autoPushEnabled,
          },
          update: {
            runtimeKind,
            allowAutoCommit: input.autoCommitEnabled,
            allowAutoPush: input.autoPushEnabled,
          },
        },
      },
    },
    include: {
      _count: {
        select: { tasks: true },
      },
    },
  });

  return toProjectDTO(project);
}

export async function deleteProject(projectId: string) {
  return prisma.project.delete({
    where: { id: projectId },
  });
}
