import { runTaskOrchestration } from "@/server/orchestrator/task-orchestrator";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;

  try {
    const task = await runTaskOrchestration(taskId);
    return Response.json({
      success: true,
      data: task,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "启动执行失败",
        },
      },
      { status: 500 }
    );
  }
}
