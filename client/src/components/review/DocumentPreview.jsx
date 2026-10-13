import { useMemo } from "react";
import { Card, SectionHeader } from "../ui/Card.jsx";
import { LoadingSkeleton } from "../ui/LoadingSkeleton.jsx";
import { Alert } from "../ui/Alert.jsx";
import { Button } from "../ui/Button.jsx";

export function DocumentPreview({
  mimeType,
  fileUrl,
  loading,
  errorMessage,
  sourcePages,
  selectedPage,
  onSelectPage,
  onOpenOriginal,
}) {
  const isPdf = mimeType === "application/pdf";
  const isImage = mimeType?.startsWith("image/");
  const previewMode = useMemo(() => {
    if (isPdf) {
      return "pdf";
    }
    if (isImage) {
      return "image";
    }
    return "text";
  }, [isImage, isPdf]);

  const pageCount = sourcePages?.length || 0;
  const currentPage =
    sourcePages?.find((page) => page.pageNumber === selectedPage) ||
    sourcePages?.[0];
  const currentPageNumber = currentPage?.pageNumber || 1;

  function goToPage(delta) {
    if (!sourcePages?.length) {
      return;
    }
    const index = sourcePages.findIndex(
      (page) => page.pageNumber === currentPageNumber
    );
    const next = sourcePages[Math.min(Math.max(index + delta, 0), pageCount - 1)];
    onSelectPage?.(next.pageNumber);
  }

  return (
    <Card className="h-full">
      <SectionHeader
        icon="📄"
        title="Original document"
        description="Preview uses authorized access only. Nothing is stored in the browser beyond this session view."
      />

      {loading ? (
        <div className="mt-4">
          <LoadingSkeleton lines={6} />
        </div>
      ) : null}

      {errorMessage ? (
        <Alert tone="warning" title="Preview unavailable" className="mt-4">
          {errorMessage}
        </Alert>
      ) : null}

      {!loading && fileUrl && previewMode === "image" ? (
        <img
          src={fileUrl}
          alt="Uploaded discharge document"
          className="mt-4 max-h-[28rem] w-full rounded-xl border border-slate-200 object-contain"
        />
      ) : null}

      {!loading && fileUrl && previewMode === "pdf" ? (
        <iframe
          title="PDF preview"
          src={fileUrl}
          className="mt-4 h-[28rem] w-full rounded-xl border border-slate-200 bg-white"
        />
      ) : null}

      {sourcePages?.length ? (
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800">
              Extracted text by page
            </p>
            {pageCount > 1 ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => goToPage(-1)}
                  disabled={currentPageNumber <= sourcePages[0].pageNumber}
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-600">
                  Page {currentPageNumber} of {pageCount}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => goToPage(1)}
                  disabled={
                    currentPageNumber >=
                    sourcePages[sourcePages.length - 1].pageNumber
                  }
                >
                  Next
                </Button>
              </div>
            ) : (
              <span className="text-sm text-slate-600">Page {currentPageNumber}</span>
            )}
          </div>
          <pre
            className="mt-3 max-h-48 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-800 whitespace-pre-wrap"
            aria-live="polite"
          >
            {currentPage?.text?.trim()
              ? currentPage.text
              : "No readable text on this page."}
          </pre>
        </div>
      ) : null}

      {onOpenOriginal ? (
        <div className="mt-4">
          <Button type="button" variant="ghost" onClick={onOpenOriginal}>
            Open original file
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
