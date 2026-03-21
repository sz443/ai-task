export function StatCard({
  label,
  value,
  hint,
  valueClassName,
}: {
  label: string;
  value: string | number;
  hint?: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/75 p-5 shadow-sm backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-3 text-3xl font-semibold tracking-tight ${valueClassName || ""}`.trim()}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
