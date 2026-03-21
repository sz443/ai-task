"use client";

import { useEffect } from "react";

import { useExecutionLogStore } from "@/store/execution-log-store";
import type { AgentRunDTO } from "@/types";

const runRoleLabelMap: Record<string, string> = {
  DISPATCHER: "策略分析",
  FRONTEND: "执行工程师",
  QA: "质量验证",
  REVIEWER: "交付审查",
};

export function AgentRunTimeline({ runs }: { runs: AgentRunDTO[] }) {
  const { selectedRunId, selectRun } = useExecutionLogStore();

  useEffect(() => {
    if (!selectedRunId && runs[0]) {
      selectRun(runs[0].id);
    }
  }, [runs, selectedRunId, selectRun]);

  return (
    <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">流程时间线</h3>
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {runs.length} stages
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {runs.map((run, index) => {
          const isActive = run.id === selectedRunId;
          return (
            <button
              key={run.id}
              type="button"
              onClick={() => selectRun(run.id)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                isActive
                  ? "border-sky-400 bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(255,255,255,0.9))] shadow-sm"
                  : "border-border bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {index + 1}. {runRoleLabelMap[run.role] || run.role}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {run.summary || "暂无摘要"}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-muted-foreground">
                  {run.status}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
