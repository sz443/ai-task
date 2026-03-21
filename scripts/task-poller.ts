import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    return;
  }

  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['\"]|['\"]$/g, "");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

async function main() {
  const { processTaskQueueOnce, runContinuousTaskPoller } =
    await import("../src/server/orchestrator/task-queue-runner");
  const runOnce = process.argv.includes("--once");

  if (runOnce) {
    const result = await processTaskQueueOnce();
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log("[task-poller] started");
  await runContinuousTaskPoller();
}

main().catch((error) => {
  console.error("[task-poller] failed", error);
  process.exit(1);
});
