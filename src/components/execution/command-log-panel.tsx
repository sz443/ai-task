"use client";

import { useMemo } from "react";

import { useExecutionLogStore } from "@/store/execution-log-store";
import type { AgentRunDTO } from "@/types";

export function CommandLogPanel({ runs }: { runs: AgentRunDTO[] }) {
  const { selectedRunId } = useExecutionLogStore();
  const selectedRun = useMemo(
    () => runs.find((run) => run.id === selectedRunId) || runs[0],
    [runs, selectedRunId]
  );

  return (
    <section className="rounded-3xl border border-border bg-white/85 p-5 shadow-sm">
      <h3 className="text-lg font-semibold">命令日志</h3>
      <div className="mt-4 space-y-4">
        {(selectedRun?.commandLogs || []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">当前 Agent 阶段没有命令日志。</p>
        ) : (
          selectedRun?.commandLogs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-border bg-slate-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{log.label || log.kind}</p>
                  <code className="mt-2 block rounded bg-slate-950 px-3 py-2 text-xs text-slate-100">{log.command}</code>
                </div>
                <div className="text-xs text-muted-foreground">
                  <div>status: {log.status}</div>
                  <div>exit: {log.exitCode ?? "-"}</div>
                  <div>耗时: {log.durationMs ?? 0}ms</div>
                </div>
              </div>
              {log.stdout ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-muted-foreground">stdout</summary>
                  <pre className="mt-2 overflow-x-auto rounded-2xl bg-slate-950 p-3 text-xs text-slate-100">{log.stdout}</pre>
                </details>
              ) : null}
              {log.stderr ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-muted-foreground">stderr</summary>
                  <pre className="mt-2 overflow-x-auto rounded-2xl bg-rose-950 p-3 text-xs text-rose-100">{log.stderr}</pre>
                </details>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
