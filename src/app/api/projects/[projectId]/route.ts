import { projectFormSchema } from "@/features/projects/schema";
import { getProjectById, updateProject } from "@/server/repositories/projects";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);

  if (!project) {
    return Response.json(
      {
        success: false,
        error: { message: "项目不存在" },
      },
      { status: 404 }
    );
  }

  return Response.json({
    success: true,
    data: project,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const json = await request.json();
  const parsed = projectFormSchema.safeParse(json);

  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        error: {
          message: "项目表单校验失败",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  const project = await updateProject(projectId, parsed.data);

  return Response.json({
    success: true,
    data: project,
  });
}
