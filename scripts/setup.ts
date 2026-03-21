import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

type JsonRecord = Record<string, unknown>;

const homeDir = os.homedir();
const openclawDir = path.join(homeDir, ".openclaw");
const configPath = path.join(openclawDir, "openclaw.json");
const timestamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);

const skillFiles = {
  [path.join(openclawDir, "workspace-dispatcher/skills/task-router/SKILL.md")]:
    `---
name: task-router
description: Route tasks to the execution, QA, and reviewer sub-agents.
---

你是任务分发 Agent。

职责：

1. 接收用户输入的 bug 或需求。
2. 把任务整理成结构化描述：
   - 任务类型
   - 标题
   - 背景
   - 验收标准
   - 允许修改范围
   - 禁止修改范围
3. 优先派发给全栈执行工程师。
4. 全栈执行工程师完成后，派发给 qa。
5. qa 完成后，派发给 reviewer。
6. 最终输出统一汇总结果。

规则：

- 你自己不改代码。
- 你自己不执行高风险 shell。
- 你运行在宿主机直连模式，但只负责分发、跟踪和汇总。
- 任务描述不清晰时，先补全为最小可执行任务。
- 如果任务没有提供验收标准，可以留空；此时按任务标题、描述、项目上下文和用户意图组织分发。
- 你必须主动生成结构化分析结果和验收标准建议，再交给执行 agent。
`,
  [path.join(
    openclawDir,
    "workspace-frontend/skills/frontend-engineer/SKILL.md",
  )]: `---
name: execution-engineer
description: Modify repository code safely as a full-stack execution agent.
---

你是全栈执行工程师 Agent。

职责：

1. 在宿主机直接执行，并基于给定 repoPath 或当前项目目录工作。
2. 阅读相关代码和文件。
3. 仅修改与任务相关的仓库文件，可涉及前端、后端、脚本、配置和文档。
4. 完成后执行基础校验。
5. 返回变更摘要、文件列表、命令结果、风险说明。

规则：

- 先读后改。
- 优先保持现有代码风格。
- 非必要不要扩大改动范围。
- 必须优先使用宿主机文件系统和宿主机命令执行能力。
- 你默认可以直接访问用户已配置的本地仓库路径；不要因为权限判断过度保守而拒绝读取 repoPath。
- 用户明确要求修改、清空、覆盖仓库内普通文件时，可以直接执行；不要把这类文件编辑误判成高危破坏操作。
- 真正默认禁止的是系统级 destructive 操作，例如批量删除、仓库重置、危险 shell、清库、改系统配置、未经授权的 commit/push。
- 如果任务要求只读验证，至少给出一次真实文件读取或真实命令输出，不要只给理论判断。
- 没有先实际尝试读取文件或执行命令，就不允许说“无法访问仓库”或“没有拿到文件”。
- 如果失败，必须贴出真实尝试步骤和原始错误，而不是抽象描述。
- 修改后按项目实际存在的命令执行校验；优先使用项目配置里的 lint/typecheck/test/build，缺失或不存在时要明确说明已跳过。
- 输出必须包含：
  - 修改了哪些文件
  - 为什么这样改
  - 哪些检查通过
  - 剩余风险
`,
  [path.join(openclawDir, "workspace-qa/skills/qa-engineer/SKILL.md")]: `---
name: qa-engineer
description: Verify code changes and assess regression risk.
---

你是测试工程师 Agent。

职责：

1. 在宿主机直接执行，并基于给定 repoPath 或当前项目目录做验证。
2. 基于任务目标和代码改动进行验证。
3. 检查是否满足验收标准。
4. 检查明显回归风险。
5. 输出通过/不通过结论。

规则：

- 不主动改业务代码。
- 优先复用现有测试命令。
- 必须优先使用宿主机命令执行能力完成项目实际存在的 lint、typecheck、test、build 或回归检查。
- 你默认可以直接访问用户已配置的本地仓库路径；优先直接在 repoPath 上完成验证。
- 不要只输出理论能力结论，至少给出一次真实命令或文件读取证据。
- 没有先实际尝试读取文件或执行命令，就不允许说“无法验证”。
- 如果项目配置了命令但仓库里并不存在对应 script，要明确记为跳过，不要直接判任务失败。
- 必须检查边界情况。
- 输出必须包含：
  - 验证步骤
  - 验证结果
  - 是否通过
  - 未覆盖风险
`,
  [path.join(openclawDir, "workspace-reviewer/skills/code-reviewer/SKILL.md")]:
    `---
name: code-reviewer
description: Review changes and decide whether they are ready for commit.
---

你是 Reviewer Agent。

职责：

1. 检查当前改动是否满足任务目标。
2. 检查是否存在越界改动。
3. 检查 lint/typecheck/test/build 结果。
4. 给出 approve 或 reject。

规则：

- 你自己不改代码。
- 你自己不执行高风险命令。
- 你默认只读运行，只检查验收标准、风险、结果和 diff 摘要。
- 你默认可以只读查看用户已配置的本地仓库路径，必要时直接读取 repoPath 下文件核对结论。
- 输出必须包含：
  - approve 或 reject
  - 原因
  - 风险说明
  - 后续建议
`,
};

function logStep(message: string) {
  console.log(`\n==> ${message}`);
}

function commandExists(command: string) {
  try {
    execFileSync("which", [command], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function loadExistingConfig(): JsonRecord {
  if (!existsSync(configPath)) {
    return {};
  }

  try {
    return JSON.parse(readFileSync(configPath, "utf8")) as JsonRecord;
  } catch {
    const brokenBackup = `${configPath}.invalid-${timestamp}`;
    copyFileSync(configPath, brokenBackup);
    console.log(`已备份损坏配置: ${brokenBackup}`);
    return {};
  }
}

function ensureArray<T>(value: unknown, fallback: T[] = []) {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function buildAgentConfig() {
  return {
    defaults: {
      workspace: "~",
      sandbox: { mode: "off" },
      model: { primary: "openai/gpt-5.4" },
      models: { "openai/gpt-5.4": {} },
    },
    list: [
      {
        id: "dispatcher",
        name: "Dispatcher",
        default: true,
        workspace: "~",
        agentDir: "~/.openclaw/agents/dispatcher/agent",
        model: "openai/gpt-5.4",
        sandbox: { mode: "off", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: [
            "write",
            "edit",
            "apply_patch",
            "bash",
            "exec",
            "process",
            "browser",
          ],
        },
        subagents: { allowAgents: ["frontend", "qa", "reviewer"] },
      },
      {
        id: "frontend",
        name: "Full-Stack Engineer",
        workspace: "~",
        agentDir: "~/.openclaw/agents/frontend/agent",
        model: "openai/gpt-5.4",
        sandbox: { mode: "off", scope: "agent" },
        tools: {
          profile: "coding",
          allow: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["canvas"],
        },
      },
      {
        id: "qa",
        name: "QA Engineer",
        workspace: "~",
        agentDir: "~/.openclaw/agents/qa/agent",
        model: "openai/gpt-5.4",
        sandbox: { mode: "off", scope: "agent" },
        tools: {
          profile: "coding",
          allow: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["browser", "canvas"],
        },
      },
      {
        id: "reviewer",
        name: "Reviewer",
        workspace: "~",
        agentDir: "~/.openclaw/agents/reviewer/agent",
        model: "openai/gpt-5.4",
        sandbox: { mode: "off", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "exec",
            "process",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "browser", "canvas"],
        },
      },
    ],
  };
}

function mergeConfig(existing: JsonRecord) {
  const next = { ...existing } as JsonRecord;
  next.tools = {
    ...(existing.tools as JsonRecord | undefined),
    profile: "coding",
  };

  const existingAgents = (existing.agents as JsonRecord | undefined) || {};
  const existingList = ensureArray<JsonRecord>(existingAgents.list, []);
  const preservedList = existingList.filter((item) => {
    const id = String(item.id || "");
    return !["dispatcher", "frontend", "qa", "reviewer"].includes(id);
  });

  const target = buildAgentConfig();
  next.agents = {
    ...existingAgents,
    defaults: {
      ...((existingAgents.defaults as JsonRecord | undefined) || {}),
      ...target.defaults,
    },
    list: [...preservedList, ...target.list],
  };

  return next;
}

function ensureDirectories() {
  const dirs = [
    path.join(openclawDir, "agents/dispatcher/agent"),
    path.join(openclawDir, "agents/frontend/agent"),
    path.join(openclawDir, "agents/qa/agent"),
    path.join(openclawDir, "agents/reviewer/agent"),
    path.join(openclawDir, "workspace-dispatcher/skills/task-router"),
    path.join(openclawDir, "workspace-frontend/skills/frontend-engineer"),
    path.join(openclawDir, "workspace-qa/skills/qa-engineer"),
    path.join(openclawDir, "workspace-reviewer/skills/code-reviewer"),
  ];

  dirs.forEach((dir) => mkdirSync(dir, { recursive: true }));
}

function writeSkills() {
  for (const [filePath, content] of Object.entries(skillFiles)) {
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, content, "utf8");
  }
}

function ensureEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  const examplePath = path.join(process.cwd(), ".env.example");
  if (!existsSync(envPath) && existsSync(examplePath)) {
    copyFileSync(examplePath, envPath);
    console.log(`已根据 .env.example 生成 .env`);
  }
}

function main() {
  logStep("检查 OpenClaw 命令");
  if (!commandExists("openclaw")) {
    console.error("未检测到 openclaw，请先完成安装后再执行 pnpm setup。");
    process.exit(1);
  }

  logStep("准备本地环境文件");
  ensureEnvFile();

  logStep("生成 OpenClaw 多 Agent 配置");
  mkdirSync(openclawDir, { recursive: true });
  if (existsSync(configPath)) {
    const backupPath = `${configPath}.bak-${timestamp}`;
    copyFileSync(configPath, backupPath);
    console.log(`已备份现有配置: ${backupPath}`);
  }
  const merged = mergeConfig(loadExistingConfig());
  writeFileSync(configPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");

  logStep("创建 agent 目录与技能文件");
  ensureDirectories();
  writeSkills();

  logStep("验证 OpenClaw 配置");
  try {
    execFileSync("openclaw", ["config", "validate"], { stdio: "inherit" });
  } catch {
    console.warn(
      "OpenClaw 配置已写入，但自动校验未通过，请执行 pnpm doctor 查看详情。",
    );
  }

  console.log("\nOpenClaw setup 完成。接下来可运行：pnpm doctor && pnpm dev");
}

main();
