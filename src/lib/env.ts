export const appEnv = {
  appName: process.env.APP_NAME || "Local AI Task Hub",
  databaseUrl: process.env.DATABASE_URL || "file:./dev.db",
  agentRuntimeKind: process.env.AGENT_RUNTIME_KIND || "openclaw",
  agentRuntimeBaseUrl:
    process.env.AGENT_RUNTIME_BASE_URL || "http://127.0.0.1:4100",
  taskPollerIntervalMs: Number(process.env.TASK_POLLER_INTERVAL_MS || 30000),
  taskPollerBatchSize: Number(process.env.TASK_POLLER_BATCH_SIZE || 1),
  taskPollerProjectSlugs: (process.env.TASK_POLLER_PROJECT_SLUGS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
  taskPollerToken: process.env.TASK_POLLER_TOKEN || "",
};
