export function RepoPathField({
  inputProps,
  error,
}: {
  inputProps: React.ComponentProps<"input">;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">本地仓库路径</label>
      <input
        placeholder="/Users/you/code/funhub-web"
        className="w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm shadow-sm outline-none ring-0 placeholder:text-muted-foreground focus:border-sky-500"
        {...inputProps}
      />
      <p className="text-xs text-muted-foreground">建议填写绝对路径，后续 Repo Executor 将在这个目录执行 git 与校验命令。</p>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
