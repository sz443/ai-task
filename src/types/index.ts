export const TASK_TYPES = ["BUG", "FEATURE", "CHORE", "REFACTOR", "TEST_TASK"] as const;
export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const TASK_STATUSES = [
  "TODO",
  "DISPATCHING",
  "IN_PROGRESS_FRONTEND",
  "READY_FOR_QA",
  "IN_PROGRESS_QA",
  "IN_REVIEW",
  "AWAITING_HUMAN_APPROVAL",
  "APPROVED",
  "REJECTED",
  "DONE",
  "FAILED",
  "BLOCKED",
] as const;
export const AGENT_ROLES = ["DISPATCHER", "FRONTEND", "QA", "REVIEWER"] as const;
export const AGENT_RUN_STATUSES = ["QUEUED", "RUNNING", "SUCCEEDED", "FAILED", "BLOCKED", "CANCELLED"] as const;
export const APPROVAL_DECISIONS = ["APPROVE", "REJECT", "REQUEST_CHANGES"] as const;

export type TaskType = (typeof TASK_TYPES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type AgentRole = (typeof AGENT_ROLES)[number];
export type AgentRunStatus = (typeof AGENT_RUN_STATUSES)[number];
export type ApprovalDecision = (typeof APPROVAL_DECISIONS)[number];

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    fieldErrors?: Record<string, string[] | undefined>;
  };
}

export interface ProjectDTO {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  repoPath: string;
  defaultBranch: string;
  allowedPaths: string[];
  forbiddenPaths: string[];
  lintCommand?: string | null;
  typecheckCommand?: string | null;
  testCommand?: string | null;
  buildCommand?: string | null;
  autoCommitEnabled: boolean;
  autoPushEnabled: boolean;
  isArchived: boolean;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAcceptanceCriterionDTO {
  id: string;
  content: string;
  sortOrder: number;
  isCompleted: boolean;
}

export interface CommandLogDTO {
  id: string;
  kind: string;
  label?: string | null;
  command: string;
  cwd: string;
  status: string;
  exitCode?: number | null;
  stdout?: string | null;
  stderr?: string | null;
  durationMs?: number | null;
  startedAt?: string | null;
  finishedAt?: string | null;
}

export interface ArtifactDTO {
  id: string;
  kind: string;
  title: string;
  summary?: string | null;
  path?: string | null;
  content?: string | null;
  contentJson?: string | null;
  createdAt: string;
}

export interface AgentRunDTO {
  id: string;
  role: AgentRole;
  status: AgentRunStatus;
  provider: string;
  title?: string | null;
  summary?: string | null;
  errorMessage?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  branchName?: string | null;
  commandLogs: CommandLogDTO[];
  artifacts: ArtifactDTO[];
}

export interface StatusHistoryDTO {
  id: string;
  fromStatus?: TaskStatus | null;
  toStatus: TaskStatus;
  trigger: string;
  actorType: string;
  actorName?: string | null;
  agentRole?: AgentRole | null;
  note?: string | null;
  createdAt: string;
}

export interface TaskCommentDTO {
  id: string;
  authorType: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface TaskDTO {
  id: string;
  sequence: number;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  projectId: string;
  projectName: string;
  branchName?: string | null;
  allowedPaths: string[];
  forbiddenPaths: string[];
  notes?: string | null;
  failureReason?: string | null;
  blockedReason?: string | null;
  lastDispatchSummary?: string | null;
  lastReviewSummary?: string | null;
  humanApprovalNote?: string | null;
  currentAgentRole?: AgentRole | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  acceptanceCriteria: TaskAcceptanceCriterionDTO[];
  agentRuns: AgentRunDTO[];
  artifacts: ArtifactDTO[];
  statusHistory: StatusHistoryDTO[];
  comments: TaskCommentDTO[];
}
