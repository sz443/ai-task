# 本地多项目 AI Bug/需求管理系统 MVP 蓝图

## 1. MVP 需求文档

### 产品目标

- 为个人开发者或小团队提供一个本地部署、单机可运行的任务管理系统。
- 围绕本地仓库管理、任务结构化、Agent 执行、日志留存、人工审批构建完整闭环。
- 所有核心数据保存在本地 SQLite，便于备份、迁移、离线使用。

### 用户角色

- 项目维护者：录入项目、维护仓库配置、审核任务结果。
- 任务发起人：创建 Bug / 需求 / Chore / Refactor / Test Task。
- AI Agent：dispatcher / frontend / qa / reviewer 四类执行角色。
- 系统执行器：本地 Orchestrator + Repo Executor。

### 使用场景

#### 场景 1：项目管理

- 录入本地仓库路径。
- 配置默认分支与允许/禁止改动目录。
- 配置 lint/typecheck/test/build 命令。
- 配置是否允许自动 commit / push。

#### 场景 2：任务创建

- 创建任务并指定所属项目。
- 维护验收标准。
- 维护改动边界。
- 记录备注与优先级。

#### 场景 3：AI 执行

- 点击“开始执行”。
- 任务进入 `dispatching`。
- dispatcher 整理任务上下文。
- frontend 执行代码修改。
- qa 执行 lint/typecheck/test/build。
- reviewer 生成审核结论。
- 进入 `awaiting_human_approval`。

#### 场景 4：日志与产物

- 查看状态流转。
- 查看每个 Agent Run 摘要。
- 查看命令 stdout/stderr。
- 查看产物摘要、文件列表和审核结论。

### 核心功能范围

- 项目 CRUD
- 任务 CRUD
- 任务状态流转
- Agent Run 日志记录
- Command Log 记录
- Artifact 记录
- 人工审批
- 本地仓库命令执行
- 可扩展的 Orchestrator 适配层

### 非目标范围

- 用户系统
- 权限系统
- 云端部署
- Docker 必须依赖
- 实时 WebSocket 流
- PR 平台接入
- 多租户
- 插件市场

### MVP 边界

- 单机运行优先。
- 先打通结构化流程和日志链路。
- 真实 AI 代码修改先由 mock provider 占位。
- 自动 push 默认关闭。
- 自动 commit 仅预留配置，不强制接通。

### 页面清单

- `/projects`
- `/projects/new`
- `/projects/[projectId]`
- `/projects/[projectId]/edit`
- `/tasks`
- `/tasks/new`
- `/tasks/[taskId]`
- `/settings`

### 关键流程

1. 创建项目
2. 创建任务
3. 启动执行
4. Agent 编排
5. QA 校验
6. Reviewer 审核
7. 人工审批
8. 完成或打回

### 状态流转设计

- `todo`
- `dispatching`
- `in_progress_frontend`
- `ready_for_qa`
- `in_progress_qa`
- `in_review`
- `awaiting_human_approval`
- `approved`
- `rejected`
- `done`
- `failed`
- `blocked`

### 风险与限制

- SQLite 并发能力有限，后续多进程场景需评估 PostgreSQL。
- 本地命令执行有安全边界要求，需要严格校验 repoPath 与目录范围。
- Mock Provider 只能打通流程，不能代表真实 AI 改码质量。
- 不做实时推流，长任务执行期间只能刷新查看状态。

## 2. 系统架构设计

### 整体模块划分

- Next.js App Router UI 层
- Server Actions / Route Handlers
- Repository 数据访问层
- Agent Orchestrator
- Repo Executor
- Prisma + SQLite
- 日志与状态流转模块

### 前端模块

- Dashboard Layout
- 项目管理模块
- 任务管理模块
- 执行日志视图
- 人工审批区
- 系统设置页

### 后端模块

- 项目仓储 `src/server/repositories/projects.ts`
- 任务仓储 `src/server/repositories/tasks.ts`
- Orchestrator `src/server/orchestrator/task-orchestrator.ts`
- Repo Executor `src/server/executor/repo-executor.ts`
- Agent Provider `src/server/agents/*`

### 数据访问层

- Prisma Client 单例封装：`src/lib/prisma.ts`
- DTO Mapper：`src/server/dto/mappers.ts`
- Repository 负责查询、写入、状态流转和日志落库

### Agent Orchestrator

- 输入：`taskId`
- 读取 Task + Project + ExecutionConfig
- 组装执行上下文
- 调用 dispatcher
- 调用 frontend
- 执行 QA 命令
- 调用 reviewer
- 写入 AgentRun / CommandLog / Artifact / StatusHistory
- 最终进入 `awaiting_human_approval`

### Repo Executor

- 校验 repoPath 存在
- 校验是否为 git 仓库
- 获取当前分支
- 预留任务分支创建能力
- 执行 lint/typecheck/test/build
- 收集 stdout/stderr
- 校验 changed files 是否越界

### 日志系统

- `AgentRun`：阶段级日志
- `CommandLog`：命令级日志
- `Artifact`：摘要级产物
- `StatusHistory`：状态变更审计
- `TaskComment`：补充人工评论

### 本地数据库方案

- SQLite + Prisma
- 数据文件位于 `prisma/dev.db`
- 支持后续切 PostgreSQL

### 后续扩展点

- OpenClaw Adapter
- 真正 diff / patch / branch / commit 记录
- 高级筛选与搜索
- 仪表盘统计
- 异步队列

## 3. 数据库表设计

已落地完整 schema：

- [schema.prisma](/Users/east/ai-task/prisma/schema.prisma)

核心实体：

- `Project`
- `Task`
- `TaskAcceptanceCriterion`
- `AgentRun`
- `CommandLog`
- `Artifact`
- `StatusHistory`
- `TaskComment`
- `ExecutionConfig`

设计原则：

- 可审计
- 可追溯
- 支持一任务多次执行
- 支持多 Agent Run
- 支持后续 commit/push 扩展

## 4. API / Server Actions 设计

### Route Handlers

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/[projectId]`
- `PATCH /api/projects/[projectId]`
- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/[taskId]`
- `PATCH /api/tasks/[taskId]`
- `POST /api/tasks/[taskId]/start`
- `POST /api/tasks/[taskId]/approval`
- `GET /api/tasks/[taskId]/logs`

### Server Actions

- `createProjectAction`
- `updateProjectAction`
- `createTaskAction`
- `updateTaskAction`
- `startTaskExecutionAction`
- `approveTaskAction`

### 适合 Route Handlers 的场景

- REST 风格对外调用
- 后续被外部 Agent Runtime 调用
- 需要标准 JSON payload

### 适合 Server Actions 的场景

- Next.js 表单直连
- 页面操作按钮
- 内部局部交互

### Payload 结构

#### 创建项目

```json
{
  "name": "funhub-web",
  "slug": "funhub-web",
  "description": "本地前端仓库",
  "repoPath": "/Users/east/code/funhub-web",
  "defaultBranch": "main",
  "allowedPathsText": "src\ncomponents\napp",
  "forbiddenPathsText": ".env\nnode_modules",
  "lintCommand": "pnpm lint",
  "typecheckCommand": "pnpm typecheck",
  "testCommand": "pnpm test",
  "buildCommand": "pnpm build",
  "autoCommitEnabled": false,
  "autoPushEnabled": false
}
```

#### 创建任务

```json
{
  "projectId": "xxx",
  "title": "修复任务列表空态",
  "description": "当列表为空时增加引导说明",
  "type": "BUG",
  "priority": "HIGH",
  "status": "TODO",
  "acceptanceCriteriaText": "显示空态\n提供新建入口",
  "allowedPathsText": "src\ncomponents",
  "forbiddenPathsText": "prisma\n.env",
  "notes": "只改前端展示层"
}
```

#### 审批任务

```json
{
  "decision": "APPROVE",
  "note": "人工检查通过"
}
```

### 返回值结构

统一：

```json
{
  "success": true,
  "data": {}
}
```

失败：

```json
{
  "success": false,
  "error": {
    "message": "校验失败",
    "fieldErrors": {}
  }
}
```

## 5. 前端页面与信息架构

### 页面路由

- `/projects` 项目列表页
- `/projects/new` 新建项目页
- `/projects/[projectId]` 项目详情页
- `/projects/[projectId]/edit` 编辑项目页
- `/tasks` 任务列表页
- `/tasks/new` 新建任务页
- `/tasks/[taskId]` 任务详情 + 执行日志视图 + 审批区
- `/settings` 系统设置页

### 布局结构

- 左侧固定导航
- 右侧主工作区
- 页面顶部标题区
- 数据概览卡片
- 主内容卡片区

### 状态展示设计

- Task Status Badge
- Priority Badge
- Agent Timeline
- CommandLog 展开面板
- Artifact 摘要卡片

### 空态 / 错误态 / 加载态

- 空态：`EmptyState`
- 错误态：Route Handler 返回统一错误结构
- 加载态：当前未单独做 skeleton，可在后续补 `loading.tsx`

## 6. 前端组件拆分建议

### Server Components

- `AppSidebar`
- `PageHeader`
- `StatCard`
- `ProjectTable`
- `TaskTable`
- `ExecutionSummaryCard`

### Client Components

- `ProjectForm`
- `TaskForm`
- `AgentRunTimeline`
- `CommandLogPanel`
- `ArtifactPanel`
- `ApprovalActions`

### 需要表单校验的组件

- `ProjectForm`
- `TaskForm`
- `ApprovalActions`

### 推荐抽为通用组件

- `EmptyState`
- `PageHeader`
- `StatCard`
- `TaskStatusBadge`
- `PriorityBadge`

## 7. 项目目录结构

```txt
src/
  app/
    (dashboard)/
      layout.tsx
      projects/
      tasks/
      settings/
    api/
      projects/
      tasks/
    layout.tsx
    page.tsx
    globals.css
  actions/
    project-actions.ts
    task-actions.ts
  components/
    app/
    common/
    execution/
    projects/
    tasks/
    ui/
  features/
    projects/
    tasks/
  lib/
    arrays.ts
    env.ts
    prisma.ts
    utils.ts
  providers/
    query-provider.tsx
  server/
    agents/
    dto/
    executor/
    orchestrator/
    repositories/
  store/
    execution-log-store.ts
  types/
    index.ts
prisma/
  schema.prisma
  seed.ts
docs/
  mvp-blueprint.md
```

### 目录职责

- `app/`: 页面、布局、API
- `actions/`: Server Actions
- `components/`: UI 组件
- `features/`: 业务表单 schema
- `server/`: 服务端业务核心
- `prisma/`: 数据库定义与 seed
- `types/`: DTO 与共享类型

## 8. 关键类型定义

已落地：

- [types/index.ts](/Users/east/ai-task/src/types/index.ts)

包含：

- `ProjectDTO`
- `TaskDTO`
- `TaskStatus`
- `TaskType`
- `AgentRole`
- `AgentRunStatus`
- `CommandLogDTO`
- `ArtifactDTO`
- `ApprovalDecision`

## 9. 任务状态机设计

### 主干流转

- `TODO -> DISPATCHING`
- `DISPATCHING -> IN_PROGRESS_FRONTEND`
- `IN_PROGRESS_FRONTEND -> READY_FOR_QA`
- `READY_FOR_QA -> IN_PROGRESS_QA`
- `IN_PROGRESS_QA -> IN_REVIEW`
- `IN_REVIEW -> AWAITING_HUMAN_APPROVAL`
- `AWAITING_HUMAN_APPROVAL -> APPROVED -> DONE`

### 异常流转

- `任意执行中状态 -> FAILED`
- `AWAITING_HUMAN_APPROVAL -> REJECTED`
- `AWAITING_HUMAN_APPROVAL -> BLOCKED`
- `FAILED -> TODO`
- `BLOCKED -> TODO`

### 触发条件

- 用户开始执行：进入 `DISPATCHING`
- dispatcher 完成：进入 frontend
- frontend 完成：进入 `READY_FOR_QA`
- QA 命令通过：进入 `IN_REVIEW`
- reviewer 完成：进入 `AWAITING_HUMAN_APPROVAL`
- 人工批准：`APPROVED -> DONE`
- 人工打回：`BLOCKED`
- 命令失败：`FAILED`

### 失败回滚思路

- MVP 不自动回滚代码。
- 失败时记录日志和状态。
- 人工查看 diff / 分支 / 命令输出后决定是否继续。

## 10. Agent Orchestrator 设计

### 模块职责

- 读取任务与项目配置
- 组装上下文
- 调用四类 Agent
- 记录 AgentRun / Artifact / StatusHistory
- QA 阶段调用 Repo Executor
- 失败时更新状态为 `FAILED`

### 最小 MVP 实现

- Provider 先用 `MockAgentProvider`
- 真正 AI 改码后续接入
- 先把流程、表结构、日志模型打通

### 接口设计

- `runTaskOrchestration(taskId: string)`

### 伪代码

```ts
loadTask(taskId)
validateRepo(project.repoPath)
status -> dispatching
run dispatcher
status -> in_progress_frontend
run frontend
collect changed files
status -> ready_for_qa
status -> in_progress_qa
run lint/typecheck/test/build
if fail => status failed
status -> in_review
run reviewer
status -> awaiting_human_approval
```

### OpenClaw 适配层

- 替换 `MockAgentProvider`
- 保留 `AgentExecutionInput`
- 保留 prompt snapshot / artifact 入库逻辑

## 11. Repo Executor 设计

### 职责

- 检查目录存在
- 检查 git 仓库
- 获取当前分支
- 预留创建任务分支
- 执行校验命令
- 收集 stdout/stderr
- 校验 changed files 是否越界

### 安全边界

- 所有命令只在配置的 repoPath 下执行
- 通过 allowedPaths / forbiddenPaths 校验改动范围
- 不默认 push

### 预留能力

- `createTaskBranch`
- `getChangedFiles`
- 后续可增加 `commitChanges` / `pushBranch`

## 12. Prisma Schema

完整可用文件：

- [schema.prisma](/Users/east/ai-task/prisma/schema.prisma)

说明：

- provider 使用 SQLite
- 已包含审计字段
- 已包含索引
- 已覆盖 Project / Task / AgentRun / CommandLog / Artifact / StatusHistory / TaskComment / ExecutionConfig

## 13. 初始化 SQL / Seed 思路

已落地：

- [seed.ts](/Users/east/ai-task/prisma/seed.ts)

内容：

- 初始化 demo project `funhub-web`
- 初始化 2 条 demo task
- 初始化 executionConfig

## 14. README 初稿

已落地：

- [README.md](/Users/east/ai-task/README.md)

## 15. 开发分阶段计划

### Phase 1：项目基础搭建

- 目标：完成 Next.js、Tailwind、Prisma、基础布局
- 交付物：layout、sidebar、README、schema
- 关键文件：`src/app/layout.tsx`、`prisma/schema.prisma`
- 风险点：Next.js 16 约束、Prisma generate 环境问题

### Phase 2：数据库与项目管理

- 目标：项目 CRUD 打通
- 交付物：项目列表、详情、编辑、API、Server Actions
- 关键文件：`projects.ts`、`project-actions.ts`
- 风险点：repoPath 合法性、表单校验

### Phase 3：任务管理

- 目标：任务 CRUD 打通
- 交付物：任务列表、详情、新建、状态展示
- 关键文件：`tasks.ts`、`task-actions.ts`
- 风险点：验收标准结构化、跨项目关联

### Phase 4：日志与状态流转

- 目标：补齐 AgentRun / CommandLog / Artifact / StatusHistory
- 交付物：任务详情日志视图
- 关键文件：`mappers.ts`、`execution/*`
- 风险点：日志层级过深导致 UI 复杂

### Phase 5：Agent Orchestrator 接入

- 目标：打通 dispatcher/frontend/qa/reviewer 链路
- 交付物：mock orchestrator + QA 命令执行
- 关键文件：`task-orchestrator.ts`、`repo-executor.ts`
- 风险点：本地命令失败、目录安全边界

### Phase 6：优化与收尾

- 目标：接入真实本地 Agent Runtime、完善回退与交互细节
- 交付物：Provider Adapter、loading/error 状态、筛选器
- 风险点：真实执行时长、稳定性与审计粒度

## 16. 最终落地代码骨架

已落地关键文件：

- [package.json](/Users/east/ai-task/package.json)
- [src/app/layout.tsx](/Users/east/ai-task/src/app/layout.tsx)
- [src/app/page.tsx](/Users/east/ai-task/src/app/page.tsx)
- [src/app/(dashboard)/projects/page.tsx](/Users/east/ai-task/src/app/(dashboard)/projects/page.tsx)
- [src/app/(dashboard)/tasks/page.tsx](/Users/east/ai-task/src/app/(dashboard)/tasks/page.tsx)
- [src/lib/prisma.ts](/Users/east/ai-task/src/lib/prisma.ts)
- [src/features/projects/schema.ts](/Users/east/ai-task/src/features/projects/schema.ts)
- [src/features/tasks/schema.ts](/Users/east/ai-task/src/features/tasks/schema.ts)
- [src/actions/project-actions.ts](/Users/east/ai-task/src/actions/project-actions.ts)
- [src/actions/task-actions.ts](/Users/east/ai-task/src/actions/task-actions.ts)
- [src/app/api/projects/route.ts](/Users/east/ai-task/src/app/api/projects/route.ts)
- [src/app/api/tasks/route.ts](/Users/east/ai-task/src/app/api/tasks/route.ts)

## 推荐先开发哪些文件

- `prisma/schema.prisma`
- `src/lib/prisma.ts`
- `src/server/repositories/projects.ts`
- `src/server/repositories/tasks.ts`
- `src/actions/project-actions.ts`
- `src/actions/task-actions.ts`
- `src/server/orchestrator/task-orchestrator.ts`
- `src/server/executor/repo-executor.ts`
- `src/app/(dashboard)/projects/page.tsx`
- `src/app/(dashboard)/tasks/[taskId]/page.tsx`

## 最容易踩坑的地方

- Next.js 16 下 Server Actions 与 App Router 的边界
- Prisma 生成器与本地环境变量
- SQLite enum / migration 兼容性
- 长时间命令执行阻塞请求
- repoPath 非法或非 git 仓库
- changed files 超出 allowedPaths / forbiddenPaths
- lint/test/build 命令在不同仓库中的差异

## 如果交给 Codex 自动生成代码，建议优先顺序

1. 先生成 Prisma schema、Prisma Client 与 seed
2. 再生成 Repository + DTO Mapper
3. 再生成项目与任务的 Server Actions / Route Handlers
4. 再生成 Dashboard 页面骨架
5. 最后生成 Orchestrator、Repo Executor 与日志视图
