import type {
  AgentRole,
  AgentRunStatus,
  ArtifactKind,
  CommandKind,
  CommandStatus,
  TaskStatus,
} from "@prisma/client";

import type {
  ApprovalFormValues,
  TaskFormValues,
} from "@/features/tasks/schema";
import { prisma } from "@/lib/prisma";
import { toTaskDTO } from "@/server/dto/mappers";
import type { TaskDTO } from "@/types";

async function getNextTaskSequence() {
  const current = await prisma.task.aggregate({
    _max: {
      sequence: true,
    },
  });

  return (current._max.sequence ?? 0) + 1;
}

export async function listTasks(): Promise<TaskDTO[]> {
  const tasks = await prisma.task.findMany({
    orderBy: [{ updatedAt: "desc" }],
    include: {
      project: true,
      acceptanceCriteria: {
        orderBy: { sortOrder: "asc" },
      },
      agentRuns: {
        orderBy: { createdAt: "asc" },
        include: {
          commandLogs: {
            orderBy: { createdAt: "asc" },
          },
          artifacts: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
      artifacts: {
        orderBy: { createdAt: "desc" },
      },
      statusHistory: {
        orderBy: { createdAt: "asc" },
      },
      comments: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return tasks.map(toTaskDTO);
}

export async function claimNextPendingTask(projectSlugs: string[] = []) {
  const task = await prisma.task.findFirst({
    where: {
      status: "TODO",
      project: {
        isArchived: false,
        ...(projectSlugs.length > 0 ? { slug: { in: projectSlugs } } : {}),
      },
    },
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
    },
  });

  if (!task) {
    return null;
  }

  const result = await prisma.task.updateMany({
    where: {
      id: task.id,
      status: "TODO",
    },
    data: {
      status: "DISPATCHING",
      currentAgentRole: "DISPATCHER",
      startedAt: new Date(),
      updatedBy: "task-poller",
    },
  });

  if (result.count === 0) {
    return null;
  }

  await prisma.statusHistory.create({
    data: {
      taskId: task.id,
      fromStatus: "TODO",
      toStatus: "DISPATCHING",
      trigger: "DISPATCH_START",
      actorType: "SYSTEM",
      actorName: "task-poller",
      agentRole: "DISPATCHER",
      note: "自动轮询器已领取任务，开始执行 dispatcher。",
    },
  });

  return task;
}

export async function getTaskById(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          executionConfig: true,
        },
      },
      acceptanceCriteria: {
        orderBy: { sortOrder: "asc" },
      },
      agentRuns: {
        orderBy: { createdAt: "asc" },
        include: {
          commandLogs: {
            orderBy: { createdAt: "asc" },
          },
          artifacts: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
      artifacts: {
        orderBy: { createdAt: "desc" },
      },
      statusHistory: {
        orderBy: { createdAt: "asc" },
      },
      comments: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!task) {
    return null;
  }

  return {
    ...toTaskDTO(task),
    project: task.project,
  };
}

export async function createTask(input: TaskFormValues) {
  const sequence = await getNextTaskSequence();
  const acceptanceCriteriaText = input.acceptanceCriteriaText || "";

  const task = await prisma.task.create({
    data: {
      sequence,
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      type: input.type,
      priority: input.priority,
      status: input.status,
      allowedPathsText: input.allowedPathsText || null,
      forbiddenPathsText: input.forbiddenPathsText || null,
      notes: input.notes || null,
      createdBy: "local-user",
      updatedBy: "local-user",
      acceptanceCriteria: {
        create: acceptanceCriteriaText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((content, index) => ({
            content,
            sortOrder: index,
          })),
      },
      statusHistory: {
        create: {
          fromStatus: null,
          toStatus: input.status,
          trigger: "MANUAL_CREATE",
          actorType: "HUMAN",
          actorName: "local-user",
          note: "任务已创建并进入队列。",
        },
      },
    },
    include: {
      project: true,
      acceptanceCriteria: {
        orderBy: { sortOrder: "asc" },
      },
      agentRuns: {
        include: {
          commandLogs: true,
          artifacts: true,
        },
      },
      artifacts: true,
      statusHistory: true,
      comments: true,
    },
  });

  return toTaskDTO(task);
}

export async function updateTask(taskId: string, input: TaskFormValues) {
  const current = await prisma.task.findUnique({
    where: { id: taskId },
    select: { status: true },
  });
  const acceptanceCriteriaText = input.acceptanceCriteriaText || "";

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      type: input.type,
      priority: input.priority,
      status: input.status,
      allowedPathsText: input.allowedPathsText || null,
      forbiddenPathsText: input.forbiddenPathsText || null,
      notes: input.notes || null,
      updatedBy: "local-user",
      acceptanceCriteria: {
        deleteMany: {},
        create: acceptanceCriteriaText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((content, index) => ({
            content,
            sortOrder: index,
          })),
      },
      statusHistory:
        current?.status !== input.status
          ? {
              create: {
                fromStatus: current?.status,
                toStatus: input.status,
                trigger: "MANUAL_UPDATE",
                actorType: "HUMAN",
                actorName: "local-user",
                note: "手动更新任务",
              },
            }
          : undefined,
    },
    include: {
      project: true,
      acceptanceCriteria: {
        orderBy: { sortOrder: "asc" },
      },
      agentRuns: {
        include: {
          commandLogs: true,
          artifacts: true,
        },
      },
      artifacts: true,
      statusHistory: true,
      comments: true,
    },
  });

  return toTaskDTO(task);
}

export async function deleteTask(taskId: string) {
  return prisma.task.delete({
    where: { id: taskId },
  });
}

export async function applyDispatcherAnalysis(args: {
  taskId: string;
  summary?: string;
  acceptanceCriteria?: string[];
}) {
  return prisma.task.update({
    where: { id: args.taskId },
    data: {
      lastDispatchSummary: args.summary || undefined,
      acceptanceCriteria: args.acceptanceCriteria
        ? {
            deleteMany: {},
            create: args.acceptanceCriteria.map((content, index) => ({
              content,
              sortOrder: index,
            })),
          }
        : undefined,
      updatedBy: "dispatcher",
    },
  });
}

export async function applyReviewerConclusion(args: {
  taskId: string;
  summary?: string;
}) {
  return prisma.task.update({
    where: { id: args.taskId },
    data: {
      lastReviewSummary: args.summary || undefined,
      updatedBy: "reviewer",
    },
  });
}

export async function transitionTaskStatus(args: {
  taskId: string;
  toStatus: TaskStatus;
  note?: string;
  actorType?: "HUMAN" | "SYSTEM" | "AGENT";
  actorName?: string;
  agentRole?: AgentRole;
  trigger?:
    | "MANUAL_CREATE"
    | "MANUAL_UPDATE"
    | "DISPATCH_START"
    | "AGENT_PROGRESS"
    | "QA_COMPLETE"
    | "REVIEW_COMPLETE"
    | "HUMAN_APPROVED"
    | "HUMAN_REJECTED"
    | "EXECUTION_FAILED"
    | "SYSTEM_SYNC";
}) {
  const current = await prisma.task.findUnique({
    where: { id: args.taskId },
    select: { status: true },
  });

  return prisma.task.update({
    where: { id: args.taskId },
    data: {
      status: args.toStatus,
      currentAgentRole:
        args.toStatus === "AWAITING_HUMAN_APPROVAL" ||
        args.toStatus === "APPROVED" ||
        args.toStatus === "REJECTED" ||
        args.toStatus === "DONE" ||
        args.toStatus === "FAILED"
          ? null
          : args.agentRole,
      startedAt:
        args.toStatus === "DISPATCHING" ||
        args.toStatus === "IN_PROGRESS_FRONTEND" ||
        args.toStatus === "IN_PROGRESS_QA"
          ? new Date()
          : undefined,
      completedAt:
        args.toStatus === "DONE" ||
        args.toStatus === "FAILED" ||
        args.toStatus === "REJECTED"
          ? new Date()
          : args.toStatus === "AWAITING_HUMAN_APPROVAL"
            ? null
            : undefined,
      updatedBy: args.actorName || "system",
      statusHistory: {
        create: {
          fromStatus: current?.status ?? null,
          toStatus: args.toStatus,
          trigger: args.trigger || "SYSTEM_SYNC",
          actorType: args.actorType || "SYSTEM",
          actorName: args.actorName || "system",
          agentRole: args.agentRole,
          note: args.note,
        },
      },
    },
  });
}

export async function createAgentRun(args: {
  taskId: string;
  projectId: string;
  role: AgentRole;
  title?: string;
  provider?: "MOCK" | "OPENCLAW" | "LOCAL_RUNTIME";
  status?: AgentRunStatus;
  attempt?: number;
  promptSnapshot?: string;
  inputContextJson?: string;
}) {
  return prisma.agentRun.create({
    data: {
      taskId: args.taskId,
      projectId: args.projectId,
      role: args.role,
      title: args.title,
      provider: args.provider || "MOCK",
      status: args.status || "RUNNING",
      attempt: args.attempt || 1,
      promptSnapshot: args.promptSnapshot,
      inputContextJson: args.inputContextJson,
      startedAt: new Date(),
    },
  });
}

export async function completeAgentRun(args: {
  agentRunId: string;
  status: AgentRunStatus;
  summary?: string;
  errorMessage?: string;
  outputContextJson?: string;
  branchName?: string;
}) {
  return prisma.agentRun.update({
    where: { id: args.agentRunId },
    data: {
      status: args.status,
      summary: args.summary,
      errorMessage: args.errorMessage,
      outputContextJson: args.outputContextJson,
      branchName: args.branchName,
      finishedAt: new Date(),
    },
  });
}

export async function createCommandLog(args: {
  taskId: string;
  projectId: string;
  agentRunId?: string;
  kind?: CommandKind;
  label?: string;
  command: string;
  cwd: string;
}) {
  return prisma.commandLog.create({
    data: {
      taskId: args.taskId,
      projectId: args.projectId,
      agentRunId: args.agentRunId,
      kind: args.kind || "SHELL",
      label: args.label,
      command: args.command,
      cwd: args.cwd,
      status: "RUNNING",
      startedAt: new Date(),
    },
  });
}

export async function completeCommandLog(args: {
  commandLogId: string;
  status: CommandStatus;
  exitCode?: number | null;
  stdout?: string | null;
  stderr?: string | null;
  durationMs?: number | null;
}) {
  return prisma.commandLog.update({
    where: { id: args.commandLogId },
    data: {
      status: args.status,
      exitCode: args.exitCode,
      stdout: args.stdout,
      stderr: args.stderr,
      durationMs: args.durationMs,
      finishedAt: new Date(),
    },
  });
}

export async function createArtifact(args: {
  taskId: string;
  agentRunId?: string;
  kind: ArtifactKind;
  title: string;
  summary?: string;
  path?: string;
  content?: string;
  contentJson?: string;
}) {
  return prisma.artifact.create({
    data: {
      taskId: args.taskId,
      agentRunId: args.agentRunId,
      kind: args.kind,
      title: args.title,
      summary: args.summary,
      path: args.path,
      content: args.content,
      contentJson: args.contentJson,
    },
  });
}

export async function approveTask(taskId: string, input: ApprovalFormValues) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: true,
    },
  });

  if (!task) {
    return null;
  }

  if (input.decision === "APPROVE") {
    await transitionTaskStatus({
      taskId,
      toStatus: "APPROVED",
      actorType: "HUMAN",
      actorName: "local-user",
      trigger: "HUMAN_APPROVED",
      note: input.note || "人工审核通过",
    });

    await transitionTaskStatus({
      taskId,
      toStatus: "DONE",
      actorType: "SYSTEM",
      actorName: "system",
      trigger: "SYSTEM_SYNC",
      note: "审批通过后，任务已完成并归档到交付记录。",
    });

    return getTaskById(taskId);
  }

  if (input.decision === "REQUEST_CHANGES") {
    await transitionTaskStatus({
      taskId,
      toStatus: "BLOCKED",
      actorType: "HUMAN",
      actorName: "local-user",
      trigger: "HUMAN_REJECTED",
      note: input.note || "需要继续修改后重新执行",
    });

    return getTaskById(taskId);
  }

  await transitionTaskStatus({
    taskId,
    toStatus: "REJECTED",
    actorType: "HUMAN",
    actorName: "local-user",
    trigger: "HUMAN_REJECTED",
    note: input.note || "人工拒绝当前改动",
  });

  return getTaskById(taskId);
}
