import { useEffect } from "react";
import { WORKFLOW_STATES } from "../constants/upload.js";
import { AppFooter, AppHeader, AppShell } from "../components/layout/AppShell.jsx";
import { UploadPanel } from "../components/upload/UploadPanel.jsx";
import { CarePlanPreviewGrid } from "../components/dashboard/CarePlanPreviewGrid.jsx";
import { ResultsDashboard } from "../components/dashboard/ResultsDashboard.jsx";
import { ConfirmDialog } from "../components/ui/ConfirmDialog.jsx";
import { useDocumentWorkflow } from "../hooks/useDocumentWorkflow.js";
import { shouldShowResultsSection } from "../utils/mapDocumentStatus.js";
import { onSessionExpired } from "../session/sessionLifecycle.js";
import { stopSpeaking } from "../speech/textToSpeech.js";
import { useTranslation } from "../i18n/LanguageProvider.jsx";
import { Alert } from "../components/ui/Alert.jsx";

const DESIGN_PREVIEW_STATES = new Set([
  WORKFLOW_STATES.PREVIEW_DASHBOARD,
  WORKFLOW_STATES.NO_EXTRACTION,
  WORKFLOW_STATES.UNCLEAR_EXTRACTION,
]);

export default function HomePage() {
  const { t } = useTranslation();
  const workflow = useDocumentWorkflow();

  useEffect(() => {
    return onSessionExpired(() => {
      stopSpeaking();
      workflow.handleSessionExpired();
    });
  }, [workflow.handleSessionExpired]);

  const isDesignPreview = DESIGN_PREVIEW_STATES.has(workflow.workflowState);
  const showLiveResults =
    !isDesignPreview &&
    workflow.activeDocument &&
    shouldShowResultsSection(workflow.workflowState);

  const showCarePlanPreview =
    !isDesignPreview &&
    !showLiveResults &&
    workflow.workflowState !== WORKFLOW_STATES.PROCESSING_FAILED &&
    workflow.workflowState !== WORKFLOW_STATES.SESSION_EXPIRED;

  const showSessionBanner =
    workflow.workflowState === WORKFLOW_STATES.SESSION_EXPIRED;

  return (
    <AppShell>
      <AppHeader />
      <main
        id="main-content"
        className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"
        tabIndex={-1}
      >
        {showSessionBanner ? (
          <Alert tone="warning" title={t("upload.sessionTitle")} className="mb-6">
            <p role="status">{t("session.expiredBanner")}</p>
          </Alert>
        ) : null}

        {isDesignPreview ? (
          <ResultsDashboard
            workflowState={workflow.workflowState}
            documentLabel={workflow.selectedFile?.name}
            isDesignPreview
            onBackToUpload={workflow.handleReset}
          />
        ) : (
          <>
            <section className="max-w-3xl" aria-labelledby="home-title">
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                {t("home.eyebrow")}
              </p>
              <h1 id="home-title" className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                {t("home.title")}
              </h1>
              <p className="mt-3 text-base leading-7 text-slate-600">{t("home.lead")}</p>
            </section>

            <div className="mt-8">
              <UploadPanel
                workflowState={workflow.workflowState}
                selectedFile={workflow.selectedFile}
                uploadProgress={workflow.uploadProgress}
                errorMessage={workflow.errorMessage}
                onFileSelect={workflow.acceptFile}
                onUploadClick={workflow.handleUploadClick}
                onReset={workflow.handleReset}
                onRetry={workflow.retryUpload}
                onPreviewDashboard={() =>
                  workflow.setWorkflowState(WORKFLOW_STATES.PREVIEW_DASHBOARD)
                }
                onPreviewNoExtraction={() =>
                  workflow.setWorkflowState(WORKFLOW_STATES.NO_EXTRACTION)
                }
                onPreviewUnclearExtraction={() =>
                  workflow.setWorkflowState(WORKFLOW_STATES.UNCLEAR_EXTRACTION)
                }
              />
            </div>

            {showCarePlanPreview ? <CarePlanPreviewGrid /> : null}

            {showLiveResults ? (
              <div ref={workflow.resultsRef} className="mt-10">
                <ResultsDashboard
                  workflowState={workflow.workflowState}
                  documentLabel={workflow.activeDocument?.originalFilename}
                  document={workflow.activeDocument}
                  statusSnapshot={workflow.statusSnapshot}
                  isDesignPreview={false}
                  onBackToUpload={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  onUploadAnother={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </div>
            ) : null}
          </>
        )}
      </main>
      <AppFooter />

      <ConfirmDialog
        open={Boolean(workflow.replacePrompt)}
        title={t("dialog.replaceTitle")}
        description={t("dialog.replaceDescription")}
        confirmLabel={t("dialog.replaceConfirm")}
        cancelLabel={t("dialog.replaceCancel")}
        onConfirm={workflow.confirmReplace}
        onCancel={workflow.cancelReplace}
      />
    </AppShell>
  );
}
