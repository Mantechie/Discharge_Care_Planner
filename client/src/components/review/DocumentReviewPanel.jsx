import { useDocumentReview } from "../../hooks/useDocumentReview.js";
import { DocumentPreview } from "./DocumentPreview.jsx";
import { ExtractionReviewContent } from "./ExtractionReviewContent.jsx";

export function DocumentReviewPanel({ documentId, documentRecord, statusSnapshot }) {
  const review = useDocumentReview(documentId, documentRecord);

  if (!documentId || !documentRecord) {
    return null;
  }

  return (
    <section aria-labelledby="document-review-heading" className="mt-8">
      <h2 id="document-review-heading" className="text-xl font-bold text-slate-900">
        Review extracted information
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Compare structured fields with your original discharge summary. Missing
        values are shown honestly — nothing is invented.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <DocumentPreview
          mimeType={review.filePreview.mimeType || documentRecord.mimeType}
          fileUrl={review.filePreview.url}
          loading={review.filePreview.loading}
          errorMessage={review.filePreview.error}
          sourcePages={review.sourceData?.pages}
          selectedPage={review.selectedPage}
          onSelectPage={review.setSelectedPage}
          onOpenOriginal={review.filePreview.url ? review.openOriginalFile : null}
        />

        <ExtractionReviewContent
          phase={review.phase}
          extractionBundle={review.extractionBundle}
          carePlan={review.carePlan}
          documentRecord={documentRecord}
          statusSnapshot={statusSnapshot}
          selectedPage={review.selectedPage}
          onSelectPage={review.setSelectedPage}
          actionMessage={review.actionMessage}
          actionError={review.actionError}
          savingMedicationId={review.savingMedicationId}
          onRunExtract={review.runExtract}
          onReextract={review.runReextract}
          onMarkReviewed={review.markReviewed}
          onSaveMedicationCorrection={review.saveMedicationCorrection}
          onResolveClarification={review.submitClarificationResolution}
          onContinue={review.continueToReady}
        />
      </div>
    </section>
  );
}
