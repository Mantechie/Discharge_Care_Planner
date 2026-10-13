export function EmptyState({ title, description, hint }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          {description}
        </p>
      ) : null}
      {hint ? (
        <p className="mt-3 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
