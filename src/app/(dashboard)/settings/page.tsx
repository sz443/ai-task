import { PageHeader } from "@/components/common/page-header";
import { appEnv } from "@/lib/env";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="系统设置"
        description="查看当前运行环境、调度参数与 Agent Runtime 配置，确保任务编排与执行链路保持一致。"
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-white/85 p-6 shadow-sm">
          <h3 className="text-lg font-semibold">环境配置</h3>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-muted-foreground">APP_NAME</dt>
              <dd className="mt-2 rounded-2xl bg-slate-50 p-3">
                {appEnv.appName}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">DATABASE_URL</dt>
              <dd className="mt-2 rounded-2xl bg-slate-50 p-3">
                {appEnv.databaseUrl}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">AGENT_RUNTIME_KIND</dt>
              <dd className="mt-2 rounded-2xl bg-slate-50 p-3">
                {appEnv.agentRuntimeKind}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">AGENT_RUNTIME_BASE_URL</dt>
              <dd className="mt-2 rounded-2xl bg-slate-50 p-3">
                {appEnv.agentRuntimeBaseUrl}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">TASK_POLLER_INTERVAL_MS</dt>
              <dd className="mt-2 rounded-2xl bg-slate-50 p-3">
                {appEnv.taskPollerIntervalMs}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">TASK_POLLER_BATCH_SIZE</dt>
              <dd className="mt-2 rounded-2xl bg-slate-50 p-3">
                {appEnv.taskPollerBatchSize}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                TASK_POLLER_PROJECT_SLUGS
              </dt>
              <dd className="mt-2 rounded-2xl bg-slate-50 p-3">
                {appEnv.taskPollerProjectSlugs.join(", ") || "全部项目"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-3xl border border-border bg-white/85 p-6 shadow-sm">
          <h3 className="text-lg font-semibold">平台运行说明</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>当前实例聚焦单环境交付，适合本地团队仓库接入与自动化执行。</li>
            <li>
              任务由 OpenClaw 多 Agent 链路统一调度，并通过本地轮询器持续推进。
            </li>
            <li>默认采用 SQLite + Prisma，便于数据迁移、备份与本地恢复。</li>
            <li>
              任务状态、执行日志、命令结果与审核结论都会沉淀在统一任务视图中。
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
