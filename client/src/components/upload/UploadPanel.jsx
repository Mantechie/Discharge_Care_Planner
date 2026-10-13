import { useRef, useState } from "react";
import {
  ACCEPTED_EXTENSIONS_LABEL,
  MAX_FILE_SIZE_BYTES,
  WORKFLOW_STATES,
} from "../../constants/upload.js";
import { Button } from "../ui/Button.jsx";
import { Alert } from "../ui/Alert.jsx";
import { Badge } from "../ui/Badge.jsx";
import { LoadingSkeleton } from "../ui/LoadingSkeleton.jsx";
import { useTranslation } from "../../i18n/LanguageProvider.jsx";
import { USE_LOCAL_DATA } from "../../api/config.js";

export function UploadPanel({
  workflowState,
  selectedFile,
  uploadProgress,
  errorMessage,
  onFileSelect,
  onUploadClick,
  onReset,
  onRetry,
  onPreviewDashboard,
  onPreviewNoExtraction,
  onPreviewUnclearExtraction,
}) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const maxMb = Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024));

  function openPicker() {
    inputRef.current?.click();
  }

  function handleFiles(fileList) {
    const file = fileList?.[0];
    if (file) {
      onFileSelect(file);
    }
  }

  function onDrop(event) {
    event.preventDefault();
    setDragActive(false);
    handleFiles(event.dataTransfer.files);
  }

  const isBusy =
    workflowState === WORKFLOW_STATES.UPLOADING ||
    workflowState === WORKFLOW_STATES.PROCESSING;

  return (
    <section aria-labelledby="upload-heading">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="upload-heading" className="text-2xl font-bold sm:text-3xl">
          {t("upload.heading")}
        </h2>
        <Badge tone="info">{t("upload.step")}</Badge>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        {USE_LOCAL_DATA ? t("upload.localModeNotice") : t("upload.intro")}
      </p>

      <div
        className={`mt-6 rounded-2xl border-2 border-dashed p-6 transition sm:p-8 ${
          dragActive
            ? "border-teal-500 bg-teal-50/50"
            : "border-slate-300 bg-white"
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
      >
        <label className="sr-only" htmlFor="discharge-file-input">
          {t("upload.heading")}
        </label>
        <input
          id="discharge-file-input"
          ref={inputRef}
          type="file"
          className="sr-only"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
          onChange={(event) => handleFiles(event.target.files)}
          disabled={isBusy}
        />

        <div className="flex flex-col items-center text-center">
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-2xl"
            aria-hidden
          >
            ↑
          </div>
          <p className="text-base font-semibold text-slate-900">{t("upload.dropTitle")}</p>
          <p className="mt-1 text-sm text-slate-600">{t("upload.dropHint")}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button type="button" onClick={openPicker} disabled={isBusy}>
              {t("upload.browse")}
            </Button>
            {selectedFile && workflowState === WORKFLOW_STATES.FILE_READY ? (
              <Button type="button" variant="secondary" onClick={onUploadClick}>
                {t("upload.submit")}
              </Button>
            ) : null}
          </div>
          <p className="mt-4 text-xs text-slate-500">
            {t("upload.supported", {
              formats: ACCEPTED_EXTENSIONS_LABEL,
              maxMb,
            })}
          </p>
        </div>
      </div>

      <StateMessages
        workflowState={workflowState}
        selectedFile={selectedFile}
        errorMessage={errorMessage}
        onReset={onReset}
        onRetry={onRetry}
        maxMb={maxMb}
      />

      {(workflowState === WORKFLOW_STATES.UPLOADING ||
        workflowState === WORKFLOW_STATES.PROCESSING ||
        workflowState === WORKFLOW_STATES.UPLOADED) && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4" aria-busy="true">
          <p className="text-sm font-medium text-slate-800" role="status">
            {workflowState === WORKFLOW_STATES.UPLOADING
              ? uploadProgress != null
                ? t("upload.uploadingPercent", { percent: uploadProgress })
                : t("upload.uploading")
              : t("upload.processing")}
          </p>
          {workflowState === WORKFLOW_STATES.UPLOADING &&
          uploadProgress != null ? (
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuenow={uploadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t("upload.uploading")}
            >
              <div
                className="h-full rounded-full bg-teal-700 transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          ) : (
            <div className="mt-3">
              <LoadingSkeleton lines={4} />
            </div>
          )}
        </div>
      )}

      <Alert tone="info" title={t("upload.privacyTitle")} className="mt-6">
        <p>{t("upload.privacyBody")}</p>
      </Alert>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-800">{t("upload.nextTitle")}</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
          <li>{t("upload.next1")}</li>
          <li>{t("upload.next2")}</li>
          <li>{t("upload.next3")}</li>
        </ol>
        <p className="mt-3 text-xs text-slate-500">
          {t("upload.designPreview")}{" "}
          <button
            type="button"
            className="font-medium text-teal-800 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            onClick={onPreviewDashboard}
          >
            {t("upload.previewDashboard")}
          </button>
          {" · "}
          <button
            type="button"
            className="font-medium text-teal-800 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            onClick={onPreviewNoExtraction}
          >
            {t("upload.previewNoExtraction")}
          </button>
          {" · "}
          <button
            type="button"
            className="font-medium text-teal-800 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            onClick={onPreviewUnclearExtraction}
          >
            {t("upload.previewUnclear")}
          </button>
        </p>
      </div>
    </section>
  );
}

function StateMessages({
  workflowState,
  selectedFile,
  errorMessage,
  onReset,
  onRetry,
  maxMb,
}) {
  const { t } = useTranslation();

  if (workflowState === WORKFLOW_STATES.FILE_READY && selectedFile) {
    return (
      <Alert tone="success" title={t("upload.fileReadyTitle")} className="mt-4">
        <p>
          {t("upload.fileReadyBody", {
            name: selectedFile.name,
            sizeKb: (selectedFile.size / 1024).toFixed(1),
          })}
        </p>
        <button
          type="button"
          className="mt-2 text-sm font-semibold text-teal-800 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          onClick={onReset}
        >
          {t("upload.clearSelection")}
        </button>
      </Alert>
    );
  }

  if (workflowState === WORKFLOW_STATES.UNSUPPORTED_FILE) {
    return (
      <Alert tone="danger" title={t("upload.unsupportedTitle")} className="mt-4" role="alert">
        {t("upload.unsupportedBody")}
        <button
          type="button"
          className="mt-2 block text-sm font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          onClick={onReset}
        >
          {t("upload.tryAgain")}
        </button>
      </Alert>
    );
  }

  if (workflowState === WORKFLOW_STATES.FILE_TOO_LARGE) {
    return (
      <Alert tone="danger" title={t("upload.tooLargeTitle")} className="mt-4" role="alert">
        {t("upload.tooLargeBody", { maxMb })}
        <button
          type="button"
          className="mt-2 block text-sm font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          onClick={onReset}
        >
          {t("upload.chooseSmaller")}
        </button>
      </Alert>
    );
  }

  if (workflowState === WORKFLOW_STATES.PROCESSING_FAILED) {
    return (
      <Alert tone="danger" title={t("upload.failedTitle")} className="mt-4" role="alert">
        {errorMessage || t("upload.failedDefault")}
        <div className="mt-3 flex flex-wrap gap-3">
          {onRetry ? (
            <button
              type="button"
              className="text-sm font-semibold text-teal-800 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              onClick={onRetry}
            >
              {t("upload.retryUpload")}
            </button>
          ) : null}
          <button
            type="button"
            className="text-sm font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            onClick={onReset}
          >
            {t("upload.clearSelection")}
          </button>
        </div>
      </Alert>
    );
  }

  if (workflowState === WORKFLOW_STATES.SESSION_EXPIRED) {
    return (
      <Alert tone="warning" title={t("upload.sessionTitle")} className="mt-4" role="alert">
        {errorMessage || t("upload.sessionDefault")}
        <button
          type="button"
          className="mt-2 block text-sm font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          onClick={onReset}
        >
          {t("upload.startOver")}
        </button>
      </Alert>
    );
  }

  return null;
}
