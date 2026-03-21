import { appEnv } from "@/lib/env";
import { claimNextPendingTask } from "@/server/repositories/tasks";

import { runTaskOrchestration } from "./task-orchestrator";

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function processTaskQueueOnce(limit = appEnv.taskPollerBatchSize) {
  const processedTaskIds: string[] = [];

  for (let index = 0; index < limit; index += 1) {
    const task = await claimNextPendingTask(appEnv.taskPollerProjectSlugs);
    if (!task) {
      break;
    }

    processedTaskIds.push(task.id);

    try {
      await runTaskOrchestration(task.id, { skipDispatchTransition: true });
    } catch (error) {
      console.error(`[task-poller] task ${task.id} failed`, error);
    }
  }

  return {
    processedTaskIds,
    processedCount: processedTaskIds.length,
  };
}

export async function runContinuousTaskPoller() {
  while (true) {
    const result = await processTaskQueueOnce();
    const idleWait =
      result.processedCount > 0 ? 1000 : appEnv.taskPollerIntervalMs;
    await sleep(idleWait);
  }
}
