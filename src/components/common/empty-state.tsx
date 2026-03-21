export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-white/80 p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 h-2 w-16 rounded-full bg-gradient-to-r from-teal-400 to-sky-500" />
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
