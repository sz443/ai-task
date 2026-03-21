import { z } from "zod";

import { TASK_PRIORITIES, TASK_STATUSES, TASK_TYPES } from "@/types";

export const taskFormSchema = z.object({
  projectId: z.string().min(1, "请选择所属项目"),
  title: z
    .string()
    .min(4, "标题至少 4 个字符")
    .max(120, "标题不能超过 120 个字符"),
  description: z.string().min(10, "请补充更完整的任务描述"),
  type: z.enum(TASK_TYPES),
  priority: z.enum(TASK_PRIORITIES),
  status: z.enum(TASK_STATUSES).default("TODO"),
  acceptanceCriteriaText: z.string().optional().or(z.literal("")),
  allowedPathsText: z.string().optional().or(z.literal("")),
  forbiddenPathsText: z.string().optional().or(z.literal("")),
  notes: z
    .string()
    .max(1000, "备注不能超过 1000 个字符")
    .optional()
    .or(z.literal("")),
});

export const approvalFormSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "REQUEST_CHANGES"]),
  note: z
    .string()
    .max(1000, "审批备注不能超过 1000 个字符")
    .optional()
    .or(z.literal("")),
});

export type TaskFormInput = z.input<typeof taskFormSchema>;
export type TaskFormValues = z.output<typeof taskFormSchema>;
export type ApprovalFormInput = z.input<typeof approvalFormSchema>;
export type ApprovalFormValues = z.output<typeof approvalFormSchema>;
