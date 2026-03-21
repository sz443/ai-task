import { z } from "zod";

export const projectFormSchema = z.object({
  name: z.string().min(2, "项目名称至少 2 个字符").max(80, "项目名称不能超过 80 个字符"),
  slug: z
    .string()
    .min(2, "项目标识至少 2 个字符")
    .max(80, "项目标识不能超过 80 个字符")
    .regex(/^[a-z0-9-]+$/, "项目标识仅支持小写字母、数字和中划线"),
  description: z.string().max(500, "描述不能超过 500 个字符").optional().or(z.literal("")),
  repoPath: z.string().min(2, "请填写本地仓库路径"),
  defaultBranch: z.string().min(1, "请填写默认分支"),
  allowedPathsText: z.string().optional().or(z.literal("")),
  forbiddenPathsText: z.string().optional().or(z.literal("")),
  lintCommand: z.string().optional().or(z.literal("")),
  typecheckCommand: z.string().optional().or(z.literal("")),
  testCommand: z.string().optional().or(z.literal("")),
  buildCommand: z.string().optional().or(z.literal("")),
  autoCommitEnabled: z.boolean().default(false),
  autoPushEnabled: z.boolean().default(false),
});

export type ProjectFormInput = z.input<typeof projectFormSchema>;
export type ProjectFormValues = z.output<typeof projectFormSchema>;
