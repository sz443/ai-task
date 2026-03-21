import { splitMultiline } from "@/lib/arrays";
import { appEnv } from "@/lib/env";
import { MockAgentProvider } from "@/server/agents/mock-agent-provider";
import { OpenClawAgentProvider } from "@/server/agents/openclaw-agent-provider";
import { normalizeRuntimeKind } from "@/server/agents/runtime-kind";
import type { AgentProvider } from "@/server/agents/types";
import { RepoExecutor } from "@/server/executor/repo-executor";
import type { TaskDTO } from "@/types";
import {
  applyDispatcherAnalysis,
  applyReviewerConclusion,
  completeAgentRun,
  completeCommandLog,
  createAgentRun,
  createArtifact,
  createCommandLog,
  getTaskById,
  transitionTaskStatus,
} from "@/server/repositories/tasks";

function extractFirstJsonBlock(text?: string) {
  if (!text) {
    return null;
  }

  const match = text.match(/```json\s*([\s\S]*?)```/i);
  if (!match?.[1]) {
    return null;
  }

  try {
    return JSON.parse(match[1].trim()) as {
      analysis?: string;
      acceptanceCriteria?: string[];
      allowedScope?: string[];
      forbiddenScope?: string[];
      executionPlan?: string[];
      validationCommands?: {
        lint?: string | null;
        typecheck?: string | null;
        test?: string | null;
        build?: string | null;
      };
    };
  } catch {
    return null;
  }
}

function classifyReviewerDecision(text?: string) {
  const normalized = (text || "").toLowerCase();
  if (normalized.includes("reject")) {
    return "REJECT" as const;
  }
  if (normalized.includes("approve")) {
    return "APPROVE" as const;
  }
  return "UNKNOWN" as const;
}

const agentProviderRegistry: Record<string, AgentProvider> = {
  mock: new MockAgentProvider(),
  openclaw: new OpenClawAgentProvider(),
};

function getProvider(runtimeKind: string) {
  return agentProviderRegistry[runtimeKind] || agentProviderRegistry.mock;
}

async function persistArtifacts(
  taskId: string,
  agentRunId: string,
  artifacts: Array<{
    kind:
      | "EXECUTION_CONTEXT"
      | "PROMPT_SNAPSHOT"
      | "FILE_LIST"
      | "DIFF_SUMMARY"
      | "PATCH_SUMMARY"
      | "QA_REPORT"
      | "REVIEW_REPORT"
      | "HUMAN_APPROVAL_NOTE"
      | "ERROR_REPORT"
      | "NOTE";
    title: string;
    summary?: string;
    content?: string;
    contentJson?: string;
  }> = [],
) {
  for (const artifact of artifacts) {
    await createArtifact({
      taskId,
      agentRunId,
      kind: artifact.kind,
      title: artifact.title,
      summary: artifact.summary,
      content: artifact.content,
      contentJson: artifact.contentJson,
    });
  }
}

async function runCommandWithLog(args: {
  taskId: string;
  projectId: string;
  agentRunId: string;
  label: string;
  kind: "LINT" | "TYPECHECK" | "TEST" | "BUILD";
  executor: RepoExecutor;
  command: string;
}) {
  const log = await createCommandLog({
    taskId: args.taskId,
    projectId: args.projectId,
    agentRunId: args.agentRunId,
    label: args.label,
    kind: args.kind,
    command: args.command,
    cwd: args.executor.repoPath,
  });

  const result = await args.executor.runConfiguredCommand(args.command);

  await completeCommandLog({
    commandLogId: log.id,
    status: result.exitCode === 0 ? "SUCCEEDED" : "FAILED",
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
    durationMs: result.durationMs,
  });

  return result;
}

async function skipCommandWithLog(args: {
  taskId: string;
  projectId: string;
  agentRunId: string;
  label: string;
  kind: "LINT" | "TYPECHECK" | "TEST" | "BUILD";
  executor: RepoExecutor;
  command: string;
  reason: string;
}) {
  const log = await createCommandLog({
    taskId: args.taskId,
    projectId: args.projectId,
    agentRunId: args.agentRunId,
    label: args.label,
    kind: args.kind,
    command: args.command,
    cwd: args.executor.repoPath,
  });

  await completeCommandLog({
    commandLogId: log.id,
    status: "SKIPPED",
    exitCode: null,
    stdout: args.reason,
    stderr: null,
    durationMs: 0,
  });
}

export async function runTaskOrchestration(
  taskId: string,
  options?: {
    skipDispatchTransition?: boolean;
    retryContext?: {
      stage: "QA" | "REVIEWER";
      reason: string;
      previousAttempt: number;
    };
  },
): Promise<TaskDTO | null> {
  const taskDetail = await getTaskById(taskId);
  if (!taskDetail?.project) {
    throw new Error("任务或项目不存在。");
  }

  const project = taskDetail.project;
  const runtimeKind = normalizeRuntimeKind(
    project.executionConfig?.runtimeKind || appEnv.agentRuntimeKind,
  );
  const provider = getProvider(runtimeKind.toLowerCase());
  const executor = new RepoExecutor(
    project.repoPath,
    taskDetail.allowedPaths.length > 0
      ? taskDetail.allowedPaths
      : splitMultiline(project.allowedPathsText),
    taskDetail.forbiddenPaths.length > 0
      ? taskDetail.forbiddenPaths
      : splitMultiline(project.forbiddenPathsText),
  );

  const repoValidation = await executor.validateProjectRepo();
  if (!repoValidation.repoExists) {
    await transitionTaskStatus({
      taskId,
      toStatus: "FAILED",
      trigger: "EXECUTION_FAILED",
      note: `仓库目录不存在: ${project.repoPath}`,
    });
    throw new Error(`仓库目录不存在: ${project.repoPath}`);
  }

  if (!repoValidation.isGitRepo) {
    await transitionTaskStatus({
      taskId,
      toStatus: "FAILED",
      trigger: "EXECUTION_FAILED",
      note: `目标目录不是 Git 仓库: ${project.repoPath}`,
    });
    throw new Error(`目标目录不是 Git 仓库: ${project.repoPath}`);
  }

  const dirtyFilesBeforeExecution = await executor
    .getDirtyFiles()
    .catch(() => []);
  const previousDispatcherAttempts = taskDetail.agentRuns.filter(
    (run) => run.role === "DISPATCHER",
  ).length;
  const attemptNumber = previousDispatcherAttempts + 1;
  const maxAutoAttempts = 3;

  const retryFromDispatcher = async (args: {
    stage: "QA" | "REVIEWER";
    reason: string;
    terminalStatus: "FAILED" | "REJECTED";
  }): Promise<TaskDTO | null> => {
    if (attemptNumber < maxAutoAttempts) {
      await transitionTaskStatus({
        taskId,
        toStatus: "DISPATCHING",
        trigger: "SYSTEM_SYNC",
        note: `${args.stage} 失败，自动回到 dispatcher 重跑第 ${attemptNumber + 1}/${maxAutoAttempts} 次：${args.reason}`,
        actorType: "SYSTEM",
        actorName: "orchestrator",
        agentRole: "DISPATCHER",
      });

      return runTaskOrchestration(taskId, {
        skipDispatchTransition: true,
        retryContext: {
          stage: args.stage,
          reason: args.reason,
          previousAttempt: attemptNumber,
        },
      });
    }

    await transitionTaskStatus({
      taskId,
      toStatus: args.terminalStatus,
      trigger: "EXECUTION_FAILED",
      note: `${args.stage} 失败，已达到最大自动重试次数 ${maxAutoAttempts}：${args.reason}`,
      actorType: "SYSTEM",
      actorName: "orchestrator",
    });

    throw new Error(args.reason);
  };

  const taskInfo = {
    id: taskDetail.id,
    title: taskDetail.title,
    description: taskDetail.description,
    type: taskDetail.type,
    priority: taskDetail.priority,
    acceptanceCriteria: taskDetail.acceptanceCriteria.map(
      (item) => item.content,
    ),
  };

  const projectInfo = {
    id: project.id,
    name: project.name,
    repoPath: project.repoPath,
    defaultBranch: project.defaultBranch,
    allowedPaths:
      taskDetail.allowedPaths.length > 0
        ? taskDetail.allowedPaths
        : splitMultiline(project.allowedPathsText),
    forbiddenPaths:
      taskDetail.forbiddenPaths.length > 0
        ? taskDetail.forbiddenPaths
        : splitMultiline(project.forbiddenPathsText),
  };

  const commands = {
    lint: project.lintCommand,
    typecheck: project.typecheckCommand,
    test: project.testCommand,
    build: project.buildCommand,
  };
  let effectiveCommands = { ...commands };

  const runtimeConfig = {
    timeoutSeconds: project.executionConfig?.timeoutSeconds || 1800,
    dispatcherName: project.executionConfig?.dispatcherName || "dispatcher",
    frontendName: project.executionConfig?.frontendName || "frontend",
    qaName: project.executionConfig?.qaName || "qa",
    reviewerName: project.executionConfig?.reviewerName || "reviewer",
    allowAutoCommit: project.executionConfig?.allowAutoCommit || false,
    allowAutoPush: project.executionConfig?.allowAutoPush || false,
  };

  if (!options?.skipDispatchTransition) {
    await transitionTaskStatus({
      taskId,
      toStatus: "DISPATCHING",
      trigger: "DISPATCH_START",
      note: "开始调用 dispatcher agent",
      actorType: "SYSTEM",
      actorName: "orchestrator",
      agentRole: "DISPATCHER",
    });
  }

  const dispatcherRun = await createAgentRun({
    taskId,
    projectId: project.id,
    role: "DISPATCHER",
    provider: runtimeKind,
    title: "任务分派",
    inputContextJson: JSON.stringify({
      task: taskInfo,
      project: projectInfo,
      commands,
      runtimeConfig,
    }),
  });

  let dispatcherResult;

  try {
    dispatcherResult = await provider.execute({
      role: "DISPATCHER",
      task: taskInfo,
      project: projectInfo,
      commands,
      runtime: runtimeConfig,
      context: {
        orchestratorMode: "task-queue",
        attemptNumber,
        maxAutoAttempts,
        retryContext: options?.retryContext || null,
      },
    });
  } catch (error) {
    await completeAgentRun({
      agentRunId: dispatcherRun.id,
      status: "FAILED",
      summary: "dispatcher 执行失败",
      errorMessage:
        error instanceof Error ? error.message : "dispatcher 执行失败",
    });

    await transitionTaskStatus({
      taskId,
      toStatus: "FAILED",
      trigger: "EXECUTION_FAILED",
      note: error instanceof Error ? error.message : "dispatcher 执行失败",
      actorType: "SYSTEM",
      actorName: "orchestrator",
    });

    throw error;
  }

  await completeAgentRun({
    agentRunId: dispatcherRun.id,
    status: "SUCCEEDED",
    summary: dispatcherResult.summary,
    outputContextJson: JSON.stringify(dispatcherResult),
  });

  await persistArtifacts(taskId, dispatcherRun.id, dispatcherResult.artifacts);

  const dispatcherAnalysis = extractFirstJsonBlock(dispatcherResult.rawOutput);
  if (dispatcherAnalysis) {
    const derivedAcceptanceCriteria = (
      dispatcherAnalysis.acceptanceCriteria || []
    )
      .map((item) => item.trim())
      .filter(Boolean);

    await applyDispatcherAnalysis({
      taskId,
      summary: dispatcherAnalysis.analysis || dispatcherResult.summary,
      acceptanceCriteria: derivedAcceptanceCriteria,
    });

    if (derivedAcceptanceCriteria.length > 0) {
      taskInfo.acceptanceCriteria = derivedAcceptanceCriteria;
    }
    if ((dispatcherAnalysis.allowedScope || []).length > 0) {
      projectInfo.allowedPaths =
        dispatcherAnalysis.allowedScope || projectInfo.allowedPaths;
    }
    if ((dispatcherAnalysis.forbiddenScope || []).length > 0) {
      projectInfo.forbiddenPaths =
        dispatcherAnalysis.forbiddenScope || projectInfo.forbiddenPaths;
    }
    if (dispatcherAnalysis.validationCommands) {
      effectiveCommands = {
        lint: dispatcherAnalysis.validationCommands.lint ?? null,
        typecheck: dispatcherAnalysis.validationCommands.typecheck ?? null,
        test: dispatcherAnalysis.validationCommands.test ?? null,
        build: dispatcherAnalysis.validationCommands.build ?? null,
      };
    }
  } else {
    await applyDispatcherAnalysis({
      taskId,
      summary: dispatcherResult.summary,
    });
  }

  await transitionTaskStatus({
    taskId,
    toStatus: "IN_PROGRESS_FRONTEND",
    trigger: "AGENT_PROGRESS",
    note: "开始调用全栈执行工程师 agent",
    actorType: "AGENT",
    actorName: "frontend",
    agentRole: "FRONTEND",
  });

  const frontendRun = await createAgentRun({
    taskId,
    projectId: project.id,
    role: "FRONTEND",
    provider: runtimeKind,
    title: "代码执行",
    inputContextJson: JSON.stringify({
      task: taskInfo,
      project: projectInfo,
      commands: effectiveCommands,
      runtimeConfig,
    }),
  });

  let frontendResult;

  try {
    frontendResult = await provider.execute({
      role: "FRONTEND",
      task: taskInfo,
      project: projectInfo,
      commands: effectiveCommands,
      runtime: runtimeConfig,
      context: {
        dispatcherSummary: dispatcherResult.summary,
      },
    });
  } catch (error) {
    await completeAgentRun({
      agentRunId: frontendRun.id,
      status: "FAILED",
      summary: "全栈执行阶段失败",
      errorMessage: error instanceof Error ? error.message : "全栈执行阶段失败",
    });

    await transitionTaskStatus({
      taskId,
      toStatus: "FAILED",
      trigger: "EXECUTION_FAILED",
      note: error instanceof Error ? error.message : "全栈执行阶段失败",
      actorType: "SYSTEM",
      actorName: "orchestrator",
    });

    throw error;
  }

  const dirtyFilesAfterFrontend = await executor
    .getDirtyFiles()
    .catch(() => []);
  const dirtyFileBaseline = new Set(dirtyFilesBeforeExecution);
  const changedFiles = dirtyFilesAfterFrontend.filter(
    (file) => !dirtyFileBaseline.has(file),
  );

  if (changedFiles.length > 0) {
    executor.assertFilesWithinScope(changedFiles);
  }

  await completeAgentRun({
    agentRunId: frontendRun.id,
    status: "SUCCEEDED",
    summary: frontendResult.summary,
    outputContextJson: JSON.stringify({ ...frontendResult, changedFiles }),
  });
  await persistArtifacts(taskId, frontendRun.id, frontendResult.artifacts);

  await createArtifact({
    taskId,
    agentRunId: frontendRun.id,
    kind: "FILE_LIST",
    title: "execution changed files",
    summary:
      changedFiles.length > 0
        ? `共检测到 ${changedFiles.length} 个改动文件`
        : dirtyFilesBeforeExecution.length > 0
          ? "仓库原本已有未提交改动，本次全栈执行阶段未新增改动文件"
          : "当前未检测到新增 git 改动",
    content:
      changedFiles.length > 0
        ? changedFiles.join("\n")
        : dirtyFilesBeforeExecution.join("\n"),
  });

  await transitionTaskStatus({
    taskId,
    toStatus: "READY_FOR_QA",
    trigger: "AGENT_PROGRESS",
    note: "全栈执行阶段完成，准备进入 QA",
    actorType: "SYSTEM",
    actorName: "orchestrator",
  });

  await transitionTaskStatus({
    taskId,
    toStatus: "IN_PROGRESS_QA",
    trigger: "AGENT_PROGRESS",
    note: "开始执行本地 QA 校验",
    actorType: "AGENT",
    actorName: "qa",
    agentRole: "QA",
  });

  const qaRun = await createAgentRun({
    taskId,
    projectId: project.id,
    role: "QA",
    provider: runtimeKind,
    title: "本地校验",
    inputContextJson: JSON.stringify({
      task: taskInfo,
      project: projectInfo,
      commands: effectiveCommands,
      runtimeConfig,
    }),
  });

  const commandQueue = [
    { key: "lint", label: "Lint", kind: "LINT" as const },
    { key: "typecheck", label: "Typecheck", kind: "TYPECHECK" as const },
    { key: "test", label: "Test", kind: "TEST" as const },
    { key: "build", label: "Build", kind: "BUILD" as const },
  ];
  const executedCommands: string[] = [];
  const skippedCommands: Array<{ command: string; reason: string }> = [];

  for (const item of commandQueue) {
    const command =
      effectiveCommands[item.key as keyof typeof effectiveCommands];
    if (!command) {
      continue;
    }

    const availability = await executor.inspectConfiguredCommand(command);
    if (!availability.runnable) {
      skippedCommands.push({
        command,
        reason: availability.reason || "命令当前不可执行",
      });

      await skipCommandWithLog({
        taskId,
        projectId: project.id,
        agentRunId: qaRun.id,
        label: item.label,
        kind: item.kind,
        executor,
        command,
        reason: availability.reason || "命令当前不可执行",
      });

      continue;
    }

    const result = await runCommandWithLog({
      taskId,
      projectId: project.id,
      agentRunId: qaRun.id,
      label: item.label,
      kind: item.kind,
      executor,
      command,
    });
    executedCommands.push(command);

    if (result.exitCode !== 0) {
      await createArtifact({
        taskId,
        agentRunId: qaRun.id,
        kind: "ERROR_REPORT",
        title: `${item.label} failed`,
        summary: `命令执行失败: ${command}`,
        content: [result.stdout, result.stderr].filter(Boolean).join("\n\n"),
      });

      await completeAgentRun({
        agentRunId: qaRun.id,
        status: "FAILED",
        summary: `${item.label} 校验失败`,
        errorMessage: result.stderr || result.stdout || `${item.label} failed`,
      });

      return retryFromDispatcher({
        stage: "QA",
        reason: `${item.label} 失败，请查看命令日志`,
        terminalStatus: "FAILED",
      });
    }
  }

  const checkedCommands = executedCommands;

  let qaResult;

  try {
    qaResult = await provider.execute({
      role: "QA",
      task: taskInfo,
      project: projectInfo,
      commands: effectiveCommands,
      runtime: runtimeConfig,
      context: {
        dispatcherSummary: dispatcherResult.summary,
        frontendSummary: frontendResult.summary,
        changedFiles,
        checkedCommands,
        skippedCommands,
      },
    });
  } catch (error) {
    await completeAgentRun({
      agentRunId: qaRun.id,
      status: "FAILED",
      summary: "qa 执行失败",
      errorMessage: error instanceof Error ? error.message : "qa 执行失败",
    });

    return retryFromDispatcher({
      stage: "QA",
      reason: error instanceof Error ? error.message : "qa 执行失败",
      terminalStatus: "FAILED",
    });
  }

  await completeAgentRun({
    agentRunId: qaRun.id,
    status: "SUCCEEDED",
    summary: qaResult.summary,
    outputContextJson: JSON.stringify(qaResult),
  });
  await persistArtifacts(taskId, qaRun.id, qaResult.artifacts);

  await createArtifact({
    taskId,
    agentRunId: qaRun.id,
    kind: "QA_REPORT",
    title: "qa summary",
    summary: qaResult.summary,
    content: JSON.stringify(
      {
        checkedCommands,
        skippedCommands,
      },
      null,
      2,
    ),
  });

  if (skippedCommands.length > 0) {
    await createArtifact({
      taskId,
      agentRunId: qaRun.id,
      kind: "NOTE",
      title: "qa skipped commands",
      summary: `已跳过 ${skippedCommands.length} 条不可执行命令配置。`,
      content: JSON.stringify(skippedCommands, null, 2),
    });
  }

  await transitionTaskStatus({
    taskId,
    toStatus: "IN_REVIEW",
    trigger: "QA_COMPLETE",
    note: "进入 reviewer 审核阶段",
    actorType: "AGENT",
    actorName: "reviewer",
    agentRole: "REVIEWER",
  });

  const reviewerRun = await createAgentRun({
    taskId,
    projectId: project.id,
    role: "REVIEWER",
    provider: runtimeKind,
    title: "审核总结",
    inputContextJson: JSON.stringify({
      task: taskInfo,
      project: projectInfo,
      commands: effectiveCommands,
      runtimeConfig,
    }),
  });

  let reviewerResult;

  try {
    reviewerResult = await provider.execute({
      role: "REVIEWER",
      task: taskInfo,
      project: projectInfo,
      commands: effectiveCommands,
      runtime: runtimeConfig,
      context: {
        dispatcherSummary: dispatcherResult.summary,
        frontendSummary: frontendResult.summary,
        qaSummary: qaResult.summary,
        changedFiles,
        checkedCommands,
        skippedCommands,
      },
    });
  } catch (error) {
    await completeAgentRun({
      agentRunId: reviewerRun.id,
      status: "FAILED",
      summary: "reviewer 执行失败",
      errorMessage:
        error instanceof Error ? error.message : "reviewer 执行失败",
    });

    return retryFromDispatcher({
      stage: "REVIEWER",
      reason: error instanceof Error ? error.message : "reviewer 执行失败",
      terminalStatus: "FAILED",
    });
  }

  await completeAgentRun({
    agentRunId: reviewerRun.id,
    status: "SUCCEEDED",
    summary: reviewerResult.summary,
    outputContextJson: JSON.stringify(reviewerResult),
  });
  await persistArtifacts(taskId, reviewerRun.id, reviewerResult.artifacts);
  await applyReviewerConclusion({
    taskId,
    summary: reviewerResult.summary,
  });

  await createArtifact({
    taskId,
    agentRunId: reviewerRun.id,
    kind: "REVIEW_REPORT",
    title: "reviewer summary",
    summary: reviewerResult.summary,
    content: reviewerResult.promptSnapshot,
  });

  const reviewDecision = classifyReviewerDecision(
    [reviewerResult.rawOutput, reviewerResult.summary]
      .filter(Boolean)
      .join("\n"),
  );

  if (reviewDecision === "APPROVE") {
    await transitionTaskStatus({
      taskId,
      toStatus: "DONE",
      trigger: "REVIEW_COMPLETE",
      note: "reviewer approve，任务自动完成",
      actorType: "SYSTEM",
      actorName: "orchestrator",
    });
  } else if (reviewDecision === "REJECT") {
    return retryFromDispatcher({
      stage: "REVIEWER",
      reason: "reviewer reject，需重新分析失败原因并下发新指令",
      terminalStatus: "REJECTED",
    });
  } else {
    await transitionTaskStatus({
      taskId,
      toStatus: "AWAITING_HUMAN_APPROVAL",
      trigger: "REVIEW_COMPLETE",
      note: "AI 执行完成，但 reviewer 未给出明确 approve/reject，等待人工审批",
      actorType: "SYSTEM",
      actorName: "orchestrator",
    });
  }

  return getTaskById(taskId);
}
