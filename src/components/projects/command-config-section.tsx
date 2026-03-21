interface CommandConfigProps {
  fields: {
    lintCommand: React.ComponentProps<"input">;
    typecheckCommand: React.ComponentProps<"input">;
    testCommand: React.ComponentProps<"input">;
    buildCommand: React.ComponentProps<"input">;
  };
  errors?: Record<string, string | undefined>;
}

const commandLabels: Array<{
  key: "lintCommand" | "typecheckCommand" | "testCommand" | "buildCommand";
  label: string;
  placeholder: string;
}> = [
  { key: "lintCommand", label: "Lint 命令", placeholder: "pnpm lint" },
  { key: "typecheckCommand", label: "Typecheck 命令", placeholder: "pnpm typecheck" },
  { key: "testCommand", label: "Test 命令", placeholder: "pnpm test" },
  { key: "buildCommand", label: "Build 命令", placeholder: "pnpm build" },
];

export function CommandConfigSection({ fields, errors }: CommandConfigProps) {
  return (
    <section className="space-y-4 rounded-3xl border border-border bg-white/80 p-5 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold">命令配置</h3>
        <p className="mt-1 text-sm text-muted-foreground">QA 阶段会按这里的配置执行 lint、类型检查、测试与构建。</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {commandLabels.map((item) => (
          <div key={item.key} className="space-y-2">
            <label className="text-sm font-medium">{item.label}</label>
            <input
              placeholder={item.placeholder}
              className="w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-sky-500"
              {...fields[item.key]}
            />
            {errors?.[item.key] ? <p className="text-xs text-destructive">{errors[item.key]}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
