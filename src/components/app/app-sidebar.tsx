import Link from "next/link";

import {
  FolderKanban,
  LayoutDashboard,
  Settings2,
  Tickets,
} from "lucide-react";

import { appEnv } from "@/lib/env";

const navItems = [
  { href: "/projects", label: "项目管理", icon: FolderKanban },
  { href: "/tasks", label: "任务中心", icon: Tickets },
  { href: "/settings", label: "系统设置", icon: Settings2 },
];

export function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-5 py-6 text-sidebar-foreground lg:flex">
      <Link
        href="/projects"
        className="rounded-2xl border border-white/10 bg-white/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
          Local AI Task Hub
        </p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight">
          {appEnv.appName}
        </h2>
        <p className="mt-2 text-sm text-sidebar-foreground/70">
          统一管理仓库接入、任务编排、AI 执行链路与交付结果。
        </p>
      </Link>

      <nav className="mt-8 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-sidebar-foreground/85 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-3 text-sm">
          <LayoutDashboard className="size-4 text-sky-300" />
          <span>Local Runtime / SQLite / OpenClaw Agents</span>
        </div>
        <p className="mt-3 text-xs leading-5 text-sidebar-foreground/70">
          当前实例已启用本地任务轮询与多 Agent
          编排，可持续驱动受控仓库内的研发任务执行。
        </p>
      </div>
    </aside>
  );
}
