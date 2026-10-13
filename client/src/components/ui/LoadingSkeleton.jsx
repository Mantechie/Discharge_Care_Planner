export function LoadingSkeleton({ lines = 3 }) {
  return (
    <div className="animate-pulse space-y-3" aria-hidden>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-3 rounded-full bg-slate-200"
          style={{ width: `${88 - index * 12}%` }}
        />
      ))}
    </div>
  );
}
