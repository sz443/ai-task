"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/common/toast-provider";

export function DeleteEntryButton({
  label,
  confirmText,
  redirectTo,
  onDelete,
  size = "sm",
}: {
  label: string;
  confirmText: string;
  redirectTo: string;
  onDelete: () => Promise<{ success: boolean; error?: { message?: string } }>;
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { pushToast } = useToast();

  return (
    <Button
      type="button"
      variant="destructive"
      size={size}
      className="min-w-[96px] justify-center"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm(confirmText)) {
          return;
        }

        startTransition(async () => {
          const result = await onDelete();
          if (!result.success) {
            pushToast(result.error?.message || "删除失败", "error");
            return;
          }

          pushToast(`${label}成功`, "success");
          router.push(redirectTo);
          router.refresh();
        });
      }}
    >
      {isPending ? "删除中..." : label}
    </Button>
  );
}
