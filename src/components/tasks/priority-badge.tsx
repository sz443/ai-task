import type { TaskPriority } from "@/types";
import { cn } from "@/lib/utils";

const priorityLabelMap: Record<TaskPriority, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  URGENT: "紧急",
};

const priorityClassMap: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-cyan-100 text-cyan-700",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-rose-100 text-rose-700",
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-medium", priorityClassMap[priority])}>
      {priorityLabelMap[priority]}
    </span>
  );
}
