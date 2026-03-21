## AI Task

AI Task 是一个面向本地研发仓库的 AI 工程任务平台，用于统一管理项目接入、任务编排、代码执行、验证流程与交付记录。

平台内置一套基于 OpenClaw 的多 Agent 工作流：

- `dispatcher`：策略分析与任务拆解
- `frontend`：全栈执行工程师
- `qa`：质量验证
- `reviewer`：交付审查

## 核心能力

- 接入多个本地仓库并集中管理执行边界
- 任务创建后自动进入多 Agent 编排流程
- dispatcher 自动补全验收标准与推荐验证命令
- QA / Reviewer 失败后自动回到 dispatcher 重跑，最多 3 次
- 统一沉淀执行日志、命令记录、产物摘要与流转记录

## 环境要求

- Node.js 18+
- pnpm 9+
- OpenClaw CLI 已安装并可直接执行 `openclaw`

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/sz443/ai-task.git
cd ai-task
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 一键初始化 OpenClaw

```bash
pnpm setup
```

这个命令会自动完成：

- 检查 `openclaw` 是否可用
- 创建或合并 `~/.openclaw/openclaw.json`
- 生成 `dispatcher / frontend / qa / reviewer` 四个 agent
- 写入对应的 skills 配置
- 如果项目根目录缺少 `.env`，则根据 `.env.example` 自动生成

### 4. 运行自检

```bash
pnpm doctor
```

自检会检查：

- OpenClaw 是否安装
- `~/.openclaw/openclaw.json` 是否存在
- 4 个 agent 是否已注册
- OpenClaw 配置是否能通过校验
- `.env` 是否存在
- 本地 poller 是否已启动

### 5. 启动应用

```bash
pnpm dev
```

默认会同时启动：

- Web 应用
- 后台任务轮询器（poller）

默认访问：

```text
http://localhost:3000
```

## 数据库初始化

如果你第一次启动，需要准备 Prisma 数据库：

```bash
pnpm db:push
pnpm db:seed
```

## 任务轮询

### 单次执行一轮任务

```bash
pnpm task:poller:once
```

### 持续轮询

```bash
pnpm task:poller
```

说明：`pnpm dev` 与 `pnpm start` 已经会自动带起 poller。只有在你想单独运行轮询器时，才需要手动执行这条命令。

## 推荐接入流程

### 1. 接入项目

在 Web 界面中创建项目时，至少填写：

- 项目名称
- 本地仓库路径 `repoPath`
- 默认分支
- 禁止修改范围（如有）

### 2. 创建任务

创建任务时只需要提供：

- 标题
- 描述
- 项目

验收标准可以留空，dispatcher 会在运行时自动补全分析结果与建议性验收标准。

### 3. 自动进入执行流程

任务创建后会自动走完整链路：

1. `dispatcher` 分析任务与项目上下文
2. `frontend` 执行修改
3. `qa` 执行验证
4. `reviewer` 进行交付审查

如果 `qa` 失败或 `reviewer` 失败 / reject，系统会回到 `dispatcher`，重新分析失败原因并再次下发指令，最多自动重跑 3 轮。

## OpenClaw 配置说明

初始化脚本会把 OpenClaw 配置成：

- 宿主机直连模式（不依赖独立 Docker sandbox）
- `dispatcher` 默认只读
- `reviewer` 默认只读
- `frontend` / `qa` 具备宿主机代码读写与命令执行能力
- 全局 `tools.profile = coding`

## 常用命令

```bash
pnpm setup           # 初始化 OpenClaw agents 与配置
pnpm doctor          # 运行环境与配置自检
pnpm dev             # 启动 Web 应用 + poller
pnpm dev:web         # 仅启动 Web 开发服务
pnpm start           # 启动生产服务 + poller
pnpm start:web       # 仅启动 Web 生产服务
pnpm build           # 构建生产版本
pnpm typecheck       # TypeScript 校验
pnpm lint            # ESLint 校验
pnpm task:poller     # 持续轮询任务
pnpm task:poller:once # 单次轮询
pnpm db:push         # 推送 Prisma schema
pnpm db:seed         # 初始化示例数据
```

## 常见问题

### `pnpm setup` 提示找不到 openclaw

说明本机尚未安装 OpenClaw，或命令不在 PATH 中。请先确保下面命令可执行：

```bash
which openclaw
openclaw --help
```

### `pnpm doctor` 失败

优先检查：

- `~/.openclaw/openclaw.json` 是否存在
- `openclaw config validate` 是否通过
- `.env` 是否存在

### 任务没有自动进入流程

优先检查：

- 项目是否已接入且 `repoPath` 有效
- 后台 poller 是否启动
- 任务状态是否为 `TODO`

### QA 执行了不适合项目的命令

现在的流程会优先使用 dispatcher 在当前任务上下文中推荐的验证命令，而不是固定假设所有项目都存在 `lint / test / build`。如仍出现不合理命令，请优先检查：

- 任务描述是否足够明确
- dispatcher 输出的分析与验证命令是否合理

## 开源协作建议

如果你要把这个项目给团队内部或开源用户使用，推荐标准启动流程如下：

```bash
pnpm install
pnpm setup
pnpm doctor
pnpm db:push
pnpm db:seed
pnpm dev
```

这样同事只需要准备 Node、pnpm 和 OpenClaw，就可以在本机完成初始化。
