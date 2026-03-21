import { approvalFormSchema } from "@/features/tasks/schema";
import { approveTask } from "@/server/repositories/tasks";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const json = await request.json();
  const parsed = approvalFormSchema.safeParse(json);

  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        error: {
          message: "审批参数校验失败",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  const task = await approveTask(taskId, parsed.data);

  return Response.json({
    success: true,
    data: task,
  });
}
