import { formatReferencePrecision } from "../../utils/extractionLabels.js";

export function ChatCitationList({ citations }) {
  if (!citations?.length) {
    return null;
  }

  return (
    <div className="mt-2 border-t border-slate-200 pt-2">
      <p className="text-xs font-semibold text-slate-600">Source from your document</p>
      <ul className="mt-1 space-y-1">
        {citations.map((citation, index) => (
          <li key={`${citation.pageNumber}-${index}`} className="text-xs text-slate-600">
            {citation.pageNumber ? (
              <span className="font-medium">Page {citation.pageNumber}</span>
            ) : (
              <span className="font-medium">Page unknown</span>
            )}
            {" · "}
            {formatReferencePrecision(citation.referencePrecision)}
            {citation.quotedText ? (
              <blockquote className="mt-1 border-l-2 border-teal-200 pl-2 italic text-slate-700">
                &ldquo;{citation.quotedText}&rdquo;
              </blockquote>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
