import type { AgentRole, TaskPriority, TaskType } from "@/types";

export interface AgentExecutionInput {
  role: AgentRole;
  task: {
    id: string;
    title: string;
    description: string;
    type: TaskType;
    priority: TaskPriority;
    acceptanceCriteria: string[];
  };
  project: {
    id: string;
    name: string;
    repoPath: string;
    defaultBranch: string;
    allowedPaths: string[];
    forbiddenPaths: string[];
  };
  commands: {
    lint?: string | null;
    typecheck?: string | null;
    test?: string | null;
    build?: string | null;
  };
  runtime: {
    timeoutSeconds: number;
    dispatcherName: string;
    frontendName: string;
    qaName: string;
    reviewerName: string;
    allowAutoCommit: boolean;
    allowAutoPush: boolean;
  };
  context?: Record<string, unknown>;
}

export interface AgentExecutionOutput {
  summary: string;
  promptSnapshot: string;
  rawOutput?: string;
  artifacts?: Array<{
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
  }>;
}

export interface AgentProvider {
  execute(input: AgentExecutionInput): Promise<AgentExecutionOutput>;
}
