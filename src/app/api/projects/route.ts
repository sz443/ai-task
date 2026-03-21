import { createProject } from "@/server/repositories/projects";
import { listProjects } from "@/server/repositories/projects";
import { projectFormSchema } from "@/features/projects/schema";

export async function GET() {
  const projects = await listProjects();
  return Response.json({
    success: true,
    data: projects,
  });
}

export async function POST(request: Request) {
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

  const project = await createProject(parsed.data);

  return Response.json({
    success: true,
    data: project,
  });
}
