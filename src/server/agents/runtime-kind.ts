import type { AgentRuntimeKind } from "@prisma/client";

const runtimeKindMap: Record<string, AgentRuntimeKind> = {
  mock: "MOCK",
  openclaw: "OPENCLAW",
  local: "LOCAL_RUNTIME",
  local_runtime: "LOCAL_RUNTIME",
  "local-runtime": "LOCAL_RUNTIME",
  MOCK: "MOCK",
  OPENCLAW: "OPENCLAW",
  LOCAL_RUNTIME: "LOCAL_RUNTIME",
};

export function normalizeRuntimeKind(value?: string | null): AgentRuntimeKind {
  if (!value) {
    return "OPENCLAW";
  }

  return runtimeKindMap[value] || "OPENCLAW";
}
