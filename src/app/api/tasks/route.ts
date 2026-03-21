import { taskFormSchema } from "@/features/tasks/schema";
import { createTask, listTasks } from "@/server/repositories/tasks";

export async function GET() {
  const tasks = await listTasks();
  return Response.json({
    success: true,
    data: tasks,
  });
}

export async function POST(request: Request) {
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

  const task = await createTask(parsed.data);

  return Response.json({
    success: true,
    data: task,
  });
}
