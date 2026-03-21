import { appEnv } from "@/lib/env";
import { processTaskQueueOnce } from "@/server/orchestrator/task-queue-runner";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  if (!appEnv.taskPollerToken) {
    return true;
  }

  return request.headers.get("x-task-poller-token") === appEnv.taskPollerToken;
}

export async function GET() {
  return Response.json({
    success: true,
    data: {
      runtimeKind: appEnv.agentRuntimeKind,
      intervalMs: appEnv.taskPollerIntervalMs,
      batchSize: appEnv.taskPollerBatchSize,
      projectSlugs: appEnv.taskPollerProjectSlugs,
      tokenProtected: Boolean(appEnv.taskPollerToken),
    },
  });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json(
      {
        success: false,
        error: {
          message: "缺少有效的 task poller token",
        },
      },
      { status: 401 },
    );
  }

  const result = await processTaskQueueOnce();

  return Response.json({
    success: true,
    data: result,
  });
}
