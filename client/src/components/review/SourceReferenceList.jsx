import { formatReferencePrecision } from "../../utils/extractionLabels.js";

export function SourceReferenceList({ references, onSelectPage }) {
  if (!references?.length) {
    return (
      <p className="text-sm text-slate-500">
        No source reference provided for this item.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {references.map((reference, index) => (
        <li
          key={`${reference.pageNumber}-${index}`}
          className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            {reference.pageNumber ? (
              <button
                type="button"
                className="font-semibold text-teal-800 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                onClick={() => onSelectPage?.(reference.pageNumber)}
              >
                Page {reference.pageNumber}
              </button>
            ) : (
              <span className="font-medium text-slate-600">Page unknown</span>
            )}
            <span className="text-xs text-slate-500">
              {formatReferencePrecision(reference.referencePrecision)}
            </span>
          </div>
          {reference.quotedText ? (
            <blockquote className="mt-2 border-l-2 border-teal-200 pl-3 italic text-slate-700">
              &ldquo;{reference.quotedText}&rdquo;
            </blockquote>
          ) : (
            <p className="mt-2 text-slate-500">
              No quoted passage was attached to this reference.
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
