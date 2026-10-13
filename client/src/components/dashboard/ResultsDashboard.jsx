import { useRef } from "react";
import { WORKFLOW_STATES } from "../../constants/upload.js";
import { Card, SectionHeader } from "../ui/Card.jsx";
import { EmptyState } from "../ui/EmptyState.jsx";
import { Alert } from "../ui/Alert.jsx";
import { Button } from "../ui/Button.jsx";
import { Badge } from "../ui/Badge.jsx";
import { EmbeddedChat } from "../chat/EmbeddedChat.jsx";
import { formatFileSize } from "../../utils/formatFileSize.js";
import { DocumentReviewPanel } from "../review/DocumentReviewPanel.jsx";
import { CarePlanResultsDashboard } from "./CarePlanResultsDashboard.jsx";
import { useTranslation } from "../../i18n/LanguageProvider.jsx";

export function ResultsDashboard({
  workflowState,
  documentLabel,
  document: documentRecord,
  statusSnapshot,
  isDesignPreview = false,
  onBackToUpload,
  onUploadAnother,
}) {
  const { t } = useTranslation();
  const reviewSectionRef = useRef(null);

  const isUnclear =
    isDesignPreview && workflowState === WORKFLOW_STATES.UNCLEAR_EXTRACTION;
  const isNoData =
    isDesignPreview && workflowState === WORKFLOW_STATES.NO_EXTRACTION;
  const isReviewRequired =
    !isDesignPreview && workflowState === WORKFLOW_STATES.REVIEW_REQUIRED;
  const documentFailed =
    !isDesignPreview &&
    (workflowState === WORKFLOW_STATES.PROCESSING_FAILED ||
      documentRecord?.status === "failed");

  const status = statusSnapshot?.status || documentRecord?.status;
  const showLivePanels =
    !isDesignPreview && documentRecord?.id && !documentFailed;

  return (
    <div className="space-y-6">
      {isDesignPreview ? (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              {t("results.designPreview")}
            </p>
            <h2 className="mt-1 text-2xl font-bold">{t("results.dashboardTitle")}</h2>
          </div>
          <Button variant="secondary" onClick={onBackToUpload}>
            {t("results.backToUpload")}
          </Button>
        </div>
      ) : null}

      {isNoData ? (
        <Alert tone="warning" title={t("results.noExtractionTitle")}>
          {t("results.noExtractionBody")}
        </Alert>
      ) : null}

      {isUnclear ? (
        <Alert tone="warning" title={t("results.unclearTitle")}>
          {t("results.unclearBody")}
        </Alert>
      ) : null}

      {isReviewRequired ? (
        <Alert tone="warning" title={t("results.reviewRequiredTitle")}>
          {t("results.reviewRequiredBody")}
        </Alert>
      ) : null}

      {documentFailed ? (
        <Alert tone="danger" title={t("results.processingFailedTitle")}>
          {t("results.processingFailedBody")}
        </Alert>
      ) : null}

      {showLivePanels ? (
        <>
          <CarePlanResultsDashboard
            documentId={documentRecord.id}
            documentRecord={documentRecord}
            statusSnapshot={statusSnapshot}
            onUploadAnother={onUploadAnother || onBackToUpload}
            onJumpToReview={() =>
              reviewSectionRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <SectionHeader
                  icon="📄"
                  title="Document summary"
                  description="Metadata from your uploaded file."
                />
                <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-slate-500">Filename</dt>
                    <dd className="font-medium text-slate-900">
                      {documentRecord.originalFilename}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Size</dt>
                    <dd className="font-medium text-slate-900">
                      {formatFileSize(documentRecord.fileSize)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Processing</dt>
                    <dd>
                      <Badge tone={status === "ready" ? "success" : "info"}>
                        {status || "unknown"}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Readable text</dt>
                    <dd className="font-medium text-slate-900">
                      {documentRecord.hasReadableText
                        ? "Detected"
                        : "Limited / none"}
                    </dd>
                  </div>
                </dl>
              </Card>

              <div ref={reviewSectionRef}>
                <DocumentReviewPanel
                  documentId={documentRecord.id}
                  documentRecord={documentRecord}
                  statusSnapshot={statusSnapshot}
                />
              </div>
            </div>
            <div className="lg:col-span-1">
              <EmbeddedChat documentRecord={documentRecord} layout="sidebar" />
            </div>
          </div>
        </>
      ) : null}

      {isDesignPreview ? <DesignPreviewPlaceholder /> : null}

      {!showLivePanels && !isDesignPreview && documentRecord ? (
        <EmbeddedChat documentRecord={documentRecord} />
      ) : null}
    </div>
  );
}

function DesignPreviewPlaceholder() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <SectionHeader icon="🔍" title="Extracted information" />
          <EmptyState
            title="Layout preview only"
            description="Use live upload to load extraction from the API."
          />
        </Card>
        <Card>
          <SectionHeader icon="💊" title="Medicine instructions" />
          <EmptyState title="No live medicines" description="" />
        </Card>
      </div>
      <div className="lg:col-span-1">
        <EmbeddedChat documentRecord={null} layout="sidebar" />
      </div>
    </div>
  );
}
