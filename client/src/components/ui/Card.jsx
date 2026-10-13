export function Card({ children, className = "", as: Tag = "div" }) {
  return (
    <Tag
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      {children}
    </Tag>
  );
}

export function SectionHeader({ icon, title, description, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex gap-3">
        {icon ? (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-lg"
            aria-hidden
          >
            {icon}
          </div>
        ) : null}
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}
