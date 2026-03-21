import { taskFormSchema } from "@/features/tasks/schema";
import { getTaskById, updateTask } from "@/server/repositories/tasks";

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
    data: task,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const json = await request.json();
  const parsed = taskFormSchema.safeParse(json);

  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        error: {
          message: "任务表单校验失败",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  const task = await updateTask(taskId, parsed.data);

  return Response.json({
    success: true,
    data: task,
  });
}
