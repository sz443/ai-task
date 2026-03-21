import type {
  AgentExecutionInput,
  AgentExecutionOutput,
  AgentProvider,
} from "@/server/agents/types";

const roleSummaryMap: Record<AgentExecutionInput["role"], string> = {
  DISPATCHER:
    "已整理任务上下文、项目路径、限制目录和校验命令，准备分派给执行 Agent。",
  FRONTEND:
    "当前使用 mock provider，仅返回执行计划与变更范围摘要，不直接修改代码。",
  QA: "已根据项目配置执行本地校验命令，并整理为 QA 报告。",
  REVIEWER: "已根据 QA 结果和任务验收标准生成 reviewer 审核结论。",
};

export class MockAgentProvider implements AgentProvider {
  async execute(input: AgentExecutionInput): Promise<AgentExecutionOutput> {
    const promptSnapshot = JSON.stringify(input, null, 2);

    return {
      summary: roleSummaryMap[input.role],
      promptSnapshot,
      artifacts: [
        {
          kind: "PROMPT_SNAPSHOT",
          title: `${input.role.toLowerCase()} prompt snapshot`,
          summary: "用于比对当前 prompt 拼装逻辑。",
          content: promptSnapshot,
        },
      ],
    };
  }
}
