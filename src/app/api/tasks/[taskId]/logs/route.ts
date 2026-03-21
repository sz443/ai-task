import { getTaskById } from "@/server/repositories/tasks";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const task = await getTaskById(taskId);

  if (!task) {
    return Response.json(
      {
        success: false,
        error: { message: "任务不存在" },
      },
      { status: 404 }
    );
  }

  return Response.json({
    success: true,
    data: {
      statusHistory: task.statusHistory,
      agentRuns: task.agentRuns,
      artifacts: task.artifacts,
    },
  });
}
