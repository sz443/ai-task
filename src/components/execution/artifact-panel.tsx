"use client";

import { useMemo } from "react";

import { useExecutionLogStore } from "@/store/execution-log-store";
import type { AgentRunDTO, ArtifactDTO } from "@/types";

export function ArtifactPanel({ runs, taskArtifacts }: { runs: AgentRunDTO[]; taskArtifacts: ArtifactDTO[] }) {
  const { selectedRunId } = useExecutionLogStore();
  const selectedRun = useMemo(
    () => runs.find((run) => run.id === selectedRunId) || runs[0],
    [runs, selectedRunId]
  );

  const artifacts = selectedRun?.artifacts?.length ? selectedRun.artifacts : taskArtifacts;

  return (
    <section className="rounded-3xl border border-border bg-white/85 p-5 shadow-sm">
      <h3 className="text-lg font-semibold">产物摘要</h3>
      <div className="mt-4 space-y-3">
        {artifacts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">暂无产物摘要。</p>
        ) : (
          artifacts.map((artifact) => (
            <article key={artifact.id} className="rounded-2xl border border-border bg-slate-50/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{artifact.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{artifact.kind}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(artifact.createdAt).toLocaleString("zh-CN")}</span>
              </div>
              {artifact.summary ? <p className="mt-3 text-sm text-muted-foreground">{artifact.summary}</p> : null}
              {artifact.content ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-muted-foreground">展开内容</summary>
                  <pre className="mt-2 overflow-x-auto rounded-2xl bg-slate-950 p-3 text-xs text-slate-100">{artifact.content}</pre>
                </details>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
