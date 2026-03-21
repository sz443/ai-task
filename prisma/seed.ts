import {
  AgentRuntimeKind,
  PrismaClient,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.upsert({
    where: { slug: "funhub-web" },
    update: {
      description:
        "本地演示项目，用于验证 AI Bug/需求管理系统的多项目配置与任务执行链路。",
      repoPath: "/Users/east/code/funhub-web",
      defaultBranch: "main",
      allowedPathsText: "src\ncomponents\napp",
      forbiddenPathsText: ".env\nnode_modules\ndist",
      lintCommand: "pnpm lint",
      typecheckCommand: "pnpm typecheck",
      testCommand: "pnpm test",
      buildCommand: "pnpm build",
      updatedBy: "seed",
    },
    create: {
      slug: "funhub-web",
      name: "funhub-web",
      description:
        "本地演示项目，用于验证 AI Bug/需求管理系统的多项目配置与任务执行链路。",
      repoPath: "/Users/east/code/funhub-web",
      defaultBranch: "main",
      allowedPathsText: "src\ncomponents\napp",
      forbiddenPathsText: ".env\nnode_modules\ndist",
      lintCommand: "pnpm lint",
      typecheckCommand: "pnpm typecheck",
      testCommand: "pnpm test",
      buildCommand: "pnpm build",
      createdBy: "seed",
      updatedBy: "seed",
      executionConfig: {
        create: {
          runtimeKind: AgentRuntimeKind.OPENCLAW,
          runtimeBaseUrl: "http://127.0.0.1:4100",
          dispatcherName: "dispatcher",
          frontendName: "frontend",
          qaName: "qa",
          reviewerName: "reviewer",
          allowAutoCommit: false,
          allowAutoPush: false,
        },
      },
    },
  });

  const existingTasks = await prisma.task.findMany({
    where: { projectId: project.id },
    select: { title: true },
  });

  const existingTitles = new Set(existingTasks.map((task) => task.title));

  const seedTasks = [
    {
      title: "修复项目列表页空数据时的状态提示",
      description: "当项目列表为空时，需要显示更清晰的空态说明和引导按钮。",
      type: TaskType.BUG,
      priority: TaskPriority.HIGH,
      status: TaskStatus.TODO,
      acceptanceCriteria: [
        "列表为空时展示空态说明",
        "提供新建项目入口按钮",
        "不能影响已有列表展示逻辑",
      ],
    },
    {
      title: "新增任务执行日志摘要卡片",
      description:
        "在任务详情页顶部增加执行摘要卡片，展示最近一次 Agent 编排结果。",
      type: TaskType.FEATURE,
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.AWAITING_HUMAN_APPROVAL,
      acceptanceCriteria: [
        "显示最近一次执行状态",
        "展示最近执行 Agent 数量与命令数量",
        "展示人工审批状态",
      ],
    },
  ];

  for (const seedTask of seedTasks) {
    if (existingTitles.has(seedTask.title)) {
      continue;
    }

    const nextTaskSequence =
      (await prisma.task.aggregate({ _max: { sequence: true } }))._max
        .sequence ?? 0;

    await prisma.task.create({
      data: {
        sequence: nextTaskSequence + 1,
        projectId: project.id,
        title: seedTask.title,
        description: seedTask.description,
        type: seedTask.type,
        priority: seedTask.priority,
        status: seedTask.status,
        allowedPathsText: "src\ncomponents",
        forbiddenPathsText: "prisma\n.env",
        notes: "由 seed 初始化，便于本地开发调试。",
        createdBy: "seed",
        updatedBy: "seed",
        acceptanceCriteria: {
          create: seedTask.acceptanceCriteria.map((content, index) => ({
            content,
            sortOrder: index,
          })),
        },
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: seedTask.status,
            trigger: "MANUAL_CREATE",
            actorType: "SYSTEM",
            actorName: "seed",
            note: "初始化演示任务",
          },
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
