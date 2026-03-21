-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "repoPath" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL DEFAULT 'main',
    "allowedPathsText" TEXT,
    "forbiddenPathsText" TEXT,
    "lintCommand" TEXT,
    "typecheckCommand" TEXT,
    "testCommand" TEXT,
    "buildCommand" TEXT,
    "autoCommitEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoPushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL DEFAULT 'system',
    "updatedBy" TEXT NOT NULL DEFAULT 'system',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sequence" INTEGER NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "allowedPathsText" TEXT,
    "forbiddenPathsText" TEXT,
    "notes" TEXT,
    "branchName" TEXT,
    "currentAgentRole" TEXT,
    "failureReason" TEXT,
    "blockedReason" TEXT,
    "lastDispatchSummary" TEXT,
    "lastReviewSummary" TEXT,
    "humanApprovalNote" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdBy" TEXT NOT NULL DEFAULT 'local-user',
    "updatedBy" TEXT NOT NULL DEFAULT 'local-user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskAcceptanceCriterion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaskAcceptanceCriterion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "provider" TEXT NOT NULL DEFAULT 'MOCK',
    "title" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "summary" TEXT,
    "errorMessage" TEXT,
    "promptSnapshot" TEXT,
    "inputContextJson" TEXT,
    "outputContextJson" TEXT,
    "branchName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AgentRun_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AgentRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommandLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "agentRunId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'SHELL',
    "label" TEXT,
    "command" TEXT NOT NULL,
    "cwd" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "exitCode" INTEGER,
    "stdout" TEXT,
    "stderr" TEXT,
    "durationMs" INTEGER,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommandLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommandLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommandLog_agentRunId_fkey" FOREIGN KEY ("agentRunId") REFERENCES "AgentRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Artifact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "agentRunId" TEXT,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "path" TEXT,
    "mimeType" TEXT,
    "content" TEXT,
    "contentJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Artifact_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Artifact_agentRunId_fkey" FOREIGN KEY ("agentRunId") REFERENCES "AgentRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "trigger" TEXT NOT NULL DEFAULT 'SYSTEM_SYNC',
    "actorType" TEXT NOT NULL DEFAULT 'SYSTEM',
    "actorName" TEXT,
    "agentRole" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StatusHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "authorType" TEXT NOT NULL DEFAULT 'HUMAN',
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExecutionConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "runtimeKind" TEXT NOT NULL DEFAULT 'MOCK',
    "runtimeBaseUrl" TEXT,
    "dispatcherName" TEXT NOT NULL DEFAULT 'dispatcher',
    "frontendName" TEXT NOT NULL DEFAULT 'frontend',
    "qaName" TEXT NOT NULL DEFAULT 'qa',
    "reviewerName" TEXT NOT NULL DEFAULT 'reviewer',
    "maxRetries" INTEGER NOT NULL DEFAULT 1,
    "timeoutSeconds" INTEGER NOT NULL DEFAULT 1800,
    "allowBranchCreate" BOOLEAN NOT NULL DEFAULT true,
    "allowAutoCommit" BOOLEAN NOT NULL DEFAULT false,
    "allowAutoPush" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExecutionConfig_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_name_idx" ON "Project"("name");

-- CreateIndex
CREATE INDEX "Project_isArchived_idx" ON "Project"("isArchived");

-- CreateIndex
CREATE UNIQUE INDEX "Task_sequence_key" ON "Task"("sequence");

-- CreateIndex
CREATE INDEX "Task_projectId_status_idx" ON "Task"("projectId", "status");

-- CreateIndex
CREATE INDEX "Task_projectId_priority_idx" ON "Task"("projectId", "priority");

-- CreateIndex
CREATE INDEX "Task_projectId_type_idx" ON "Task"("projectId", "type");

-- CreateIndex
CREATE INDEX "Task_createdAt_idx" ON "Task"("createdAt");

-- CreateIndex
CREATE INDEX "TaskAcceptanceCriterion_taskId_sortOrder_idx" ON "TaskAcceptanceCriterion"("taskId", "sortOrder");

-- CreateIndex
CREATE INDEX "AgentRun_taskId_createdAt_idx" ON "AgentRun"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentRun_projectId_role_status_idx" ON "AgentRun"("projectId", "role", "status");

-- CreateIndex
CREATE INDEX "CommandLog_taskId_createdAt_idx" ON "CommandLog"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "CommandLog_agentRunId_createdAt_idx" ON "CommandLog"("agentRunId", "createdAt");

-- CreateIndex
CREATE INDEX "CommandLog_projectId_kind_idx" ON "CommandLog"("projectId", "kind");

-- CreateIndex
CREATE INDEX "Artifact_taskId_kind_createdAt_idx" ON "Artifact"("taskId", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "Artifact_agentRunId_createdAt_idx" ON "Artifact"("agentRunId", "createdAt");

-- CreateIndex
CREATE INDEX "StatusHistory_taskId_createdAt_idx" ON "StatusHistory"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "TaskComment_taskId_createdAt_idx" ON "TaskComment"("taskId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutionConfig_projectId_key" ON "ExecutionConfig"("projectId");
