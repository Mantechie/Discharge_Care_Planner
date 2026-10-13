import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchDocumentSource,
  fetchDocumentFileBlob,
  fetchExtraction,
  runStructuredExtraction,
  reprocessStructuredExtraction,
} from "../api/extraction.js";
import {
  patchCarePlan,
  recordCarePlanReview,
  resolveClarification,
} from "../api/carePlans.js";
import { ApiClientError, userFacingMessage } from "../api/errors.js";
import { translateActive } from "../i18n/runtimeTranslator.js";
import { stopSpeaking } from "../speech/textToSpeech.js";

export const REVIEW_PHASE = {
  IDLE: "idle",
  LOADING: "loading",
  EXTRACTING: "extracting",
  REEXTRACTING: "reextracting",
  READY: "ready",
  NO_READABLE_TEXT: "no_readable_text",
  EXTRACTION_FAILED: "extraction_failed",
  EXTRACTION_UNAVAILABLE: "extraction_unavailable",
  NOT_FOUND: "not_found",
  SESSION_EXPIRED: "session_expired",
  NETWORK_ERROR: "network_error",
};

export function useDocumentReview(documentId, documentRecord) {
  const [phase, setPhase] = useState(REVIEW_PHASE.IDLE);
  const [extractionBundle, setExtractionBundle] = useState(null);
  const [sourceData, setSourceData] = useState(null);
  const [filePreview, setFilePreview] = useState({
    url: null,
    mimeType: null,
    loading: false,
    error: null,
  });
  const [selectedPage, setSelectedPage] = useState(1);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [savingMedicationId, setSavingMedicationId] = useState(null);

  const abortRef = useRef(null);
  const autoExtractAttemptedRef = useRef(false);
  const fileUrlRef = useRef(null);

  const revokeFileUrl = useCallback(() => {
    if (fileUrlRef.current) {
      URL.revokeObjectURL(fileUrlRef.current);
      fileUrlRef.current = null;
    }
  }, []);

  const loadPreviewAndSource = useCallback(async (signal) => {
    setFilePreview((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const source = await fetchDocumentSource(documentId, signal);
      setSourceData(source);
      setSelectedPage(source.pages?.[0]?.pageNumber || 1);

      const { blob, contentType } = await fetchDocumentFileBlob(
        documentId,
        signal
      );
      revokeFileUrl();
      const url = URL.createObjectURL(blob);
      fileUrlRef.current = url;
      setFilePreview({
        url,
        mimeType: contentType || documentRecord?.mimeType,
        loading: false,
        error: null,
      });
    } catch (error) {
      setFilePreview((prev) => ({
        ...prev,
        loading: false,
        error: userFacingMessage(error, translateActive),
      }));

      if (error instanceof ApiClientError && error.code === "UNAUTHORIZED") {
        setPhase(REVIEW_PHASE.SESSION_EXPIRED);
      }
    }
  }, [documentId, documentRecord?.mimeType, revokeFileUrl]);

  const loadExtraction = useCallback(
    async (signal) => {
      try {
        const data = await fetchExtraction(documentId, signal);
        setExtractionBundle(data);
        setPhase(REVIEW_PHASE.READY);
        return data;
      } catch (error) {
        if (error instanceof ApiClientError) {
          if (error.code === "UNAUTHORIZED") {
            setPhase(REVIEW_PHASE.SESSION_EXPIRED);
            return null;
          }
          if (error.status === 404) {
            setExtractionBundle(null);
            return null;
          }
          if (error.code === "SOURCE_TEXT_UNAVAILABLE") {
            setPhase(REVIEW_PHASE.NO_READABLE_TEXT);
            return null;
          }
        }
        setPhase(REVIEW_PHASE.EXTRACTION_FAILED);
        setActionError(userFacingMessage(error, translateActive));
        return null;
      }
    },
    [documentId]
  );

  useEffect(() => {
    if (!documentId) {
      return undefined;
    }

    autoExtractAttemptedRef.current = false;
    stopSpeaking();
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function bootstrap() {
      setPhase(REVIEW_PHASE.LOADING);
      setActionError(null);

      if (!documentRecord?.hasReadableText) {
        setPhase(REVIEW_PHASE.NO_READABLE_TEXT);
        await loadPreviewAndSource(controller.signal);
        return;
      }

      await loadPreviewAndSource(controller.signal);
      const existing = await loadExtraction(controller.signal);

      if (!existing && documentRecord?.hasReadableText) {
        if (!autoExtractAttemptedRef.current) {
          autoExtractAttemptedRef.current = true;
          setPhase(REVIEW_PHASE.EXTRACTING);
          try {
            await runStructuredExtraction(documentId, controller.signal);
            await loadExtraction(controller.signal);
          } catch (error) {
            if (error instanceof ApiClientError) {
              if (error.code === "UNAUTHORIZED") {
                setPhase(REVIEW_PHASE.SESSION_EXPIRED);
                return;
              }
              if (
                ["AI_PROVIDER_UNAVAILABLE", "AI_CREDENTIALS_MISSING"].includes(
                  error.code
                )
              ) {
                setPhase(REVIEW_PHASE.EXTRACTION_UNAVAILABLE);
                setActionError(userFacingMessage(error, translateActive));
                return;
              }
            }
            setPhase(REVIEW_PHASE.EXTRACTION_FAILED);
            setActionError(userFacingMessage(error, translateActive));
          }
        } else {
          setPhase(REVIEW_PHASE.NOT_FOUND);
        }
      }
    }

    bootstrap();

    return () => {
      controller.abort();
      revokeFileUrl();
    };
  }, [
    documentId,
    documentRecord?.hasReadableText,
    loadExtraction,
    loadPreviewAndSource,
    revokeFileUrl,
  ]);

  const carePlan = extractionBundle?.extraction;

  const runExtract = useCallback(async () => {
    setPhase(REVIEW_PHASE.EXTRACTING);
    setActionError(null);
    try {
      await runStructuredExtraction(documentId);
      await loadExtraction();
    } catch (error) {
      setPhase(REVIEW_PHASE.EXTRACTION_FAILED);
      setActionError(userFacingMessage(error, translateActive));
    }
  }, [documentId, loadExtraction]);

  const runReextract = useCallback(async () => {
    setPhase(REVIEW_PHASE.REEXTRACTING);
    setActionError(null);
    try {
      await reprocessStructuredExtraction(documentId);
      await loadExtraction();
    } catch (error) {
      setPhase(REVIEW_PHASE.EXTRACTION_FAILED);
      setActionError(userFacingMessage(error, translateActive));
    }
  }, [documentId, loadExtraction]);

  const markReviewed = useCallback(
    async (note) => {
      if (!carePlan?.id) {
        return;
      }
      setActionError(null);
      try {
        const response = await recordCarePlanReview(carePlan.id, { note });
        setActionMessage(
          response.message ||
            "Review recorded. This is not clinical approval."
        );
        await loadExtraction();
      } catch (error) {
        setActionError(userFacingMessage(error, translateActive));
      }
    },
    [carePlan?.id, loadExtraction]
  );

  const saveMedicationCorrection = useCallback(
    async (medicationId, fields) => {
      if (!carePlan?.id) {
        return;
      }
      setSavingMedicationId(medicationId);
      setActionError(null);
      try {
        await patchCarePlan(carePlan.id, {
          medicationEdits: [{ medicationId, ...fields }],
        });
        setActionMessage("Correction saved. Original extraction is preserved.");
        await loadExtraction();
      } catch (error) {
        setActionError(userFacingMessage(error, translateActive));
      } finally {
        setSavingMedicationId(null);
      }
    },
    [carePlan?.id, loadExtraction]
  );

  const submitClarificationResolution = useCallback(
    async (clarificationId, body) => {
      if (!carePlan?.id) {
        return;
      }
      setActionError(null);
      try {
        await resolveClarification(carePlan.id, clarificationId, body);
        setActionMessage("Clarification update saved.");
        await loadExtraction();
      } catch (error) {
        setActionError(userFacingMessage(error, translateActive));
      }
    },
    [carePlan?.id, loadExtraction]
  );

  const continueToReady = useCallback(async () => {
    if (!carePlan?.id) {
      return;
    }
    setActionError(null);
    try {
      await patchCarePlan(carePlan.id, { status: "ready" });
      setActionMessage("Care plan marked ready for the next steps.");
      await loadExtraction();
    } catch (error) {
      setActionError(userFacingMessage(error, translateActive));
    }
  }, [carePlan?.id, loadExtraction]);

  const openOriginalFile = useCallback(() => {
    if (filePreview.url) {
      window.open(filePreview.url, "_blank", "noopener,noreferrer");
    }
  }, [filePreview.url]);

  return {
    phase,
    extractionBundle,
    carePlan,
    sourceData,
    filePreview,
    selectedPage,
    setSelectedPage,
    actionMessage,
    actionError,
    savingMedicationId,
    runExtract,
    runReextract,
    markReviewed,
    saveMedicationCorrection,
    submitClarificationResolution,
    continueToReady,
    openOriginalFile,
  };
}
