import { spawn } from "node:child_process";

import type {
  AgentExecutionInput,
  AgentExecutionOutput,
  AgentProvider,
} from "@/server/agents/types";

interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

function getAgentId(input: AgentExecutionInput) {
  switch (input.role) {
    case "DISPATCHER":
      return input.runtime.dispatcherName;
    case "FRONTEND":
      return input.runtime.frontendName;
    case "QA":
      return input.runtime.qaName;
    case "REVIEWER":
      return input.runtime.reviewerName;
    default:
      return "dispatcher";
  }
}

function toSummary(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "OpenClaw 未返回可解析内容。";
  }

  return normalized.length > 240
    ? `${normalized.slice(0, 237)}...`
    : normalized;
}

function buildDispatcherJsonInstruction() {
  return [
    "先输出一个 ```json 代码块```，字段必须包含：",
    "- analysis: string",
    "- acceptanceCriteria: string[]",
    "- allowedScope: string[]",
    "- forbiddenScope: string[]",
    "- executionPlan: string[]",
    "- validationCommands: { lint?: string | null, typecheck?: string | null, test?: string | null, build?: string | null }",
    "然后再输出简短中文说明。",
    "如果用户没有给验收标准，你要根据任务目标自动补全最小可执行验收标准。",
    "validationCommands 必须根据项目实际类型、任务目标和仓库情况判断；不适用的命令就填 null，不要默认塞 pnpm test 或 pnpm build。",
    "如果补充上下文里有 retryContext，你要先分析上一次失败原因，再修正验收标准、验证命令和执行计划。",
  ].join("\n");
}

function buildRolePrompt(input: AgentExecutionInput) {
  const acceptance =
    input.task.acceptanceCriteria
      .map((item, index) => `${index + 1}. ${item}`)
      .join("\n") || "- 无";
  const allowedPaths = input.project.allowedPaths.join("\n") || "- 未限制";
  const forbiddenPaths = input.project.forbiddenPaths.join("\n") || "- 无";
  const commandLines =
    [
      ["lint", input.commands.lint],
      ["typecheck", input.commands.typecheck],
      ["test", input.commands.test],
      ["build", input.commands.build],
    ]
      .filter(([, command]) => command)
      .map(([label, command]) => `- ${label}: ${command}`)
      .join("\n") || "- 当前项目未配置校验命令";

  const shared = [
    `任务标题: ${input.task.title}`,
    `任务类型: ${input.task.type}`,
    `优先级: ${input.task.priority}`,
    `任务描述: ${input.task.description}`,
    `项目名称: ${input.project.name}`,
    `仓库路径(repoPath): ${input.project.repoPath}`,
    `默认分支: ${input.project.defaultBranch}`,
    "验收标准:",
    acceptance,
    "允许修改范围:",
    allowedPaths,
    "禁止修改范围:",
    forbiddenPaths,
    "可用命令:",
    commandLines,
    `允许自动 commit: ${input.runtime.allowAutoCommit ? "是" : "否"}`,
    `允许自动 push: ${input.runtime.allowAutoPush ? "是" : "否"}`,
    "补充上下文(JSON):",
    JSON.stringify(input.context || {}, null, 2),
  ].join("\n");

  switch (input.role) {
    case "DISPATCHER":
      return [
        "你是 ai-task 的 dispatcher。",
        "请基于下面的任务和项目上下文，输出结构化分析，并明确 全栈执行工程师 -> qa -> reviewer 的串行流程。",
        "你自己不要改代码，不要执行高风险命令。",
        buildDispatcherJsonInstruction(),
        "输出必须包含：任务理解、执行顺序、验收标准、允许修改范围、禁止修改范围、推荐验证命令。",
        shared,
      ].join("\n\n");
    case "FRONTEND":
      return [
        "你是 ai-task 的全栈执行工程师 agent。",
        "直接在宿主机上处理 repoPath 指向的项目，可修改前端、后端、脚本、配置、文档等与任务相关的仓库文件。",
        "你当前已被授予较宽的宿主机目录访问能力，默认可以直接读取和修改 repoPath 下未被禁止的文件。",
        "必须先阅读相关文件，再做最小范围修改；不要碰禁止路径。",
        "用户明确要求修改、清空、覆盖仓库内普通文件时，可以直接执行；这类仓库文件编辑不应自动视为高危操作。",
        "只有系统级 destructive 操作才默认禁止，例如删除大量文件、重置仓库、清空数据库、修改系统配置、危险 shell 或未经授权的 commit/push。",
        "如果任务要求只读，就必须先读取文件或执行只读命令拿到证据，不要只给理论判断。",
        "除非你已经实际尝试过文件读取或命令执行并拿到失败结果，否则不允许输出'无法访问'、'无法执行'、'没有拿到文件'这类结论。",
        "如果尝试失败，必须原样贴出你实际执行的读取/命令步骤和错误结果。",
        "除非上下文明确允许，否则不要 commit、不要 push。",
        "校验命令只按项目实际配置和仓库实际存在的 script 执行；缺失命令应说明跳过，不要自行假设固定存在 pnpm lint/typecheck/test/build。",
        "完成后输出：修改文件、原因、执行命令结果、剩余风险。",
        shared,
      ].join("\n\n");
    case "QA":
      return [
        "你是 ai-task 的 qa agent。",
        "直接在宿主机上针对 repoPath 做验证，不主动修改业务代码。",
        "你当前已被授予较宽的宿主机目录访问能力，可以直接读取 repoPath 下未被禁止的文件。",
        "优先依据验收标准、全栈执行工程师改动摘要和已有命令结果做验证，必要时可补充只读检查。",
        "不要只输出理论能力；至少给出一次真实命令或真实文件读取证据。",
        "除非你已经实际尝试过读取或执行，否则不允许输出'无法验证'这类空结论。",
        "只检查 dispatcher 推荐且仓库真实存在的命令；如果 dispatcher 没推荐某条命令，就不要自行补跑。",
        "输出必须包含：验证步骤、验证结果、是否通过、未覆盖风险。",
        shared,
      ].join("\n\n");
    case "REVIEWER":
      return [
        "你是 ai-task 的 reviewer agent。",
        "只读审查任务结果，不直接修改代码，不执行高风险命令。",
        "你当前已被授予较宽的宿主机目录只读可见性，必要时可直接查看 repoPath 下文件来核对全栈执行工程师/qa 的结论。",
        "结合 dispatcher、全栈执行工程师、qa 的输出，判断是否满足验收标准，以及是否可以进入人工审批。",
        "输出必须包含：approve 或 reject、原因、风险说明、后续建议。",
        shared,
      ].join("\n\n");
    default:
      return shared;
  }
}

function runOpenClaw(args: string[], timeoutSeconds: number) {
  return new Promise<CliResult>((resolve, reject) => {
    const child = spawn("openclaw", args, {
      env: process.env,
      cwd: process.cwd(),
    });

    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(
      () => {
        child.kill("SIGTERM");
      },
      Math.max(timeoutSeconds, 1) * 1000,
    );

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code ?? 1,
      });
    });
  });
}

export class OpenClawAgentProvider implements AgentProvider {
  async execute(input: AgentExecutionInput): Promise<AgentExecutionOutput> {
    const agentId = getAgentId(input);
    const prompt = buildRolePrompt(input);
    const sessionId = `task-${input.task.id}-${input.role.toLowerCase()}-${Date.now()}`;
    const result = await runOpenClaw(
      [
        "agent",
        "--agent",
        agentId,
        "--session-id",
        sessionId,
        "--timeout",
        String(input.runtime.timeoutSeconds),
        "--message",
        prompt,
      ],
      input.runtime.timeoutSeconds + 10,
    );

    const combinedOutput = [result.stdout, result.stderr]
      .filter(Boolean)
      .join("\n\n");
    if (result.exitCode !== 0) {
      throw new Error(
        combinedOutput ||
          `OpenClaw agent ${agentId} 执行失败，退出码 ${result.exitCode}`,
      );
    }

    return {
      summary: toSummary(result.stdout || result.stderr),
      promptSnapshot: prompt,
      rawOutput: combinedOutput,
      artifacts: [
        {
          kind: "PROMPT_SNAPSHOT",
          title: `${input.role.toLowerCase()} prompt snapshot`,
          summary: `发送给 OpenClaw agent ${agentId} 的完整 prompt。`,
          content: prompt,
        },
        {
          kind: "NOTE",
          title: `${input.role.toLowerCase()} openclaw response`,
          summary: `OpenClaw agent ${agentId} 的原始输出。`,
          content: combinedOutput,
        },
      ],
    };
  }
}
