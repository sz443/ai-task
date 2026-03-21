import type {
  AgentRun,
  Artifact,
  CommandLog,
  Project,
  StatusHistory,
  Task,
  TaskAcceptanceCriterion,
  TaskComment,
} from "@prisma/client";
import { splitMultiline } from "@/lib/arrays";
import type {
  AgentRunDTO,
  ArtifactDTO,
  CommandLogDTO,
  ProjectDTO,
  StatusHistoryDTO,
  TaskCommentDTO,
  TaskDTO,
} from "@/types";

export function toProjectDTO(
  project: Project & {
    _count?: {
      tasks: number;
    };
  }
): ProjectDTO {
  return {
    id: project.id,
    slug: project.slug,
    name: project.name,
    description: project.description,
    repoPath: project.repoPath,
    defaultBranch: project.defaultBranch,
    allowedPaths: splitMultiline(project.allowedPathsText),
    forbiddenPaths: splitMultiline(project.forbiddenPathsText),
    lintCommand: project.lintCommand,
    typecheckCommand: project.typecheckCommand,
    testCommand: project.testCommand,
    buildCommand: project.buildCommand,
    autoCommitEnabled: project.autoCommitEnabled,
    autoPushEnabled: project.autoPushEnabled,
    isArchived: project.isArchived,
    taskCount: project._count?.tasks ?? 0,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export function toCommandLogDTO(log: CommandLog): CommandLogDTO {
  return {
    id: log.id,
    kind: log.kind,
    label: log.label,
    command: log.command,
    cwd: log.cwd,
    status: log.status,
    exitCode: log.exitCode,
    stdout: log.stdout,
    stderr: log.stderr,
    durationMs: log.durationMs,
    startedAt: log.startedAt?.toISOString() ?? null,
    finishedAt: log.finishedAt?.toISOString() ?? null,
  };
}

export function toArtifactDTO(artifact: Artifact): ArtifactDTO {
  return {
    id: artifact.id,
    kind: artifact.kind,
    title: artifact.title,
    summary: artifact.summary,
    path: artifact.path,
    content: artifact.content,
    contentJson: artifact.contentJson,
    createdAt: artifact.createdAt.toISOString(),
  };
}

export function toAgentRunDTO(
  agentRun: AgentRun & {
    commandLogs?: CommandLog[];
    artifacts?: Artifact[];
  }
): AgentRunDTO {
  return {
    id: agentRun.id,
    role: agentRun.role,
    status: agentRun.status,
    provider: agentRun.provider,
    title: agentRun.title,
    summary: agentRun.summary,
    errorMessage: agentRun.errorMessage,
    startedAt: agentRun.startedAt?.toISOString() ?? null,
    finishedAt: agentRun.finishedAt?.toISOString() ?? null,
    branchName: agentRun.branchName,
    commandLogs: (agentRun.commandLogs || []).map(toCommandLogDTO),
    artifacts: (agentRun.artifacts || []).map(toArtifactDTO),
  };
}

export function toStatusHistoryDTO(history: StatusHistory): StatusHistoryDTO {
  return {
    id: history.id,
    fromStatus: history.fromStatus,
    toStatus: history.toStatus,
    trigger: history.trigger,
    actorType: history.actorType,
    actorName: history.actorName,
    agentRole: history.agentRole,
    note: history.note,
    createdAt: history.createdAt.toISOString(),
  };
}

export function toTaskCommentDTO(comment: TaskComment): TaskCommentDTO {
  return {
    id: comment.id,
    authorType: comment.authorType,
    authorName: comment.authorName,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
  };
}

export function toTaskDTO(
  task: Task & {
    project: Project;
    acceptanceCriteria?: TaskAcceptanceCriterion[];
    agentRuns?: (AgentRun & { commandLogs?: CommandLog[]; artifacts?: Artifact[] })[];
    artifacts?: Artifact[];
    statusHistory?: StatusHistory[];
    comments?: TaskComment[];
  }
): TaskDTO {
  return {
    id: task.id,
    sequence: task.sequence,
    title: task.title,
    description: task.description,
    type: task.type,
    priority: task.priority,
    status: task.status,
    projectId: task.projectId,
    projectName: task.project.name,
    branchName: task.branchName,
    allowedPaths: splitMultiline(task.allowedPathsText),
    forbiddenPaths: splitMultiline(task.forbiddenPathsText),
    notes: task.notes,
    failureReason: task.failureReason,
    blockedReason: task.blockedReason,
    lastDispatchSummary: task.lastDispatchSummary,
    lastReviewSummary: task.lastReviewSummary,
    humanApprovalNote: task.humanApprovalNote,
    currentAgentRole: task.currentAgentRole,
    startedAt: task.startedAt?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    acceptanceCriteria: (task.acceptanceCriteria || []).map((item) => ({
      id: item.id,
      content: item.content,
      sortOrder: item.sortOrder,
      isCompleted: item.isCompleted,
    })),
    agentRuns: (task.agentRuns || []).map(toAgentRunDTO),
    artifacts: (task.artifacts || []).map(toArtifactDTO),
    statusHistory: (task.statusHistory || []).map(toStatusHistoryDTO),
    comments: (task.comments || []).map(toTaskCommentDTO),
  };
}
