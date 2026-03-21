"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  approveTaskAction,
  startTaskExecutionAction,
} from "@/actions/task-actions";
import { Button } from "@/components/ui/button";

export function ApprovalActions({
  taskId,
  status,
}: {
  taskId: string;
  status: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <section className="rounded-3xl border border-border bg-white/85 p-5 shadow-sm">
      <h3 className="text-lg font-semibold">审批与干预</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        在这里可以重新触发执行、补充审核意见，或对当前任务给出最终结论。
      </p>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={4}
        placeholder="填写审批结论、补充验证结果或说明后续处理意见"
        className="mt-4 w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-sky-500"
      />
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() =>
            startTransition(async () => {
              await startTaskExecutionAction(taskId);
              router.refresh();
            })
          }
          disabled={isPending}
        >
          重新运行流程
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            startTransition(async () => {
              await approveTaskAction(taskId, { decision: "APPROVE", note });
              router.refresh();
            })
          }
          disabled={isPending || status !== "AWAITING_HUMAN_APPROVAL"}
        >
          确认完成
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            startTransition(async () => {
              await approveTaskAction(taskId, {
                decision: "REQUEST_CHANGES",
                note,
              });
              router.refresh();
            })
          }
          disabled={isPending}
        >
          退回重试
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() =>
            startTransition(async () => {
              await approveTaskAction(taskId, { decision: "REJECT", note });
              router.refresh();
            })
          }
          disabled={isPending}
        >
          驳回
        </Button>
      </div>
    </section>
  );
}
