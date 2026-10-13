import { useCallback, useEffect, useRef, useState } from "react";
import { WORKFLOW_STATES } from "../constants/upload.js";
import { validateSelectedFile } from "../utils/validateFile.js";
import { mapBackendStatusToWorkflow } from "../utils/mapDocumentStatus.js";
import {
  deleteDocument,
  pollDocumentStatus,
  uploadDocument,
} from "../api/documents.js";
import { ApiClientError, userFacingMessage } from "../api/errors.js";
import { ensureAnonymousSession } from "../api/http.js";
import { clearAccessToken } from "../session/accessTokenStore.js";
import { translateActive } from "../i18n/runtimeTranslator.js";
import { stopSpeaking } from "../speech/textToSpeech.js";

export function useDocumentWorkflow() {
  const [workflowState, setWorkflowState] = useState(WORKFLOW_STATES.IDLE);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeDocument, setActiveDocument] = useState(null);
  const [statusSnapshot, setStatusSnapshot] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [replacePrompt, setReplacePrompt] = useState(null);

  const uploadInFlightRef = useRef(false);
  const pollAbortRef = useRef(null);
  const resultsRef = useRef(null);

  const stopPolling = useCallback(() => {
    pollAbortRef.current?.abort();
    pollAbortRef.current = null;
  }, []);

  const clearWorkspace = useCallback(() => {
    stopPolling();
    stopSpeaking();
    setActiveDocument(null);
    setStatusSnapshot(null);
    setUploadProgress(null);
    setErrorMessage(null);
  }, [stopPolling]);

  const handleSessionExpired = useCallback(() => {
    stopPolling();
    stopSpeaking();
    clearAccessToken();
    setActiveDocument(null);
    setStatusSnapshot(null);
    setUploadProgress(null);
    setSelectedFile(null);
    setReplacePrompt(null);
    setWorkflowState(WORKFLOW_STATES.SESSION_EXPIRED);
    setErrorMessage(
      userFacingMessage(
        new ApiClientError("Session expired", { code: "UNAUTHORIZED" }),
        translateActive
      )
    );
  }, [stopPolling]);

  const applyDocumentStatus = useCallback((documentRecord, status) => {
    setActiveDocument(documentRecord);
    setStatusSnapshot(status);
    const nextState = mapBackendStatusToWorkflow(status.status);
    setWorkflowState(nextState);
    return nextState;
  }, []);

  const scrollToResults = useCallback(() => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const beginUpload = useCallback(
    async (file) => {
      if (!file || uploadInFlightRef.current) {
        return;
      }

      uploadInFlightRef.current = true;
      setErrorMessage(null);
      setUploadProgress(null);
      setWorkflowState(WORKFLOW_STATES.UPLOADING);

      const abortController = new AbortController();
      pollAbortRef.current = abortController;

      try {
        await ensureAnonymousSession();

        const result = await uploadDocument(file, {
          signal: abortController.signal,
          onProgress: (percent) => setUploadProgress(percent),
        });

        const documentRecord = result.data;
        setUploadProgress(100);
        setWorkflowState(WORKFLOW_STATES.PROCESSING);

        let status = {
          status: documentRecord.status,
          id: documentRecord.id,
          extractionMethod: documentRecord.extractionMethod,
          pageCount: documentRecord.pageCount,
          hasReadableText: documentRecord.hasReadableText,
          processingErrors: documentRecord.processingErrors || [],
        };

        if (status.status === "processing" || status.status === "uploaded") {
          status = await pollDocumentStatus(documentRecord.id, {
            signal: abortController.signal,
            onUpdate: setStatusSnapshot,
          });
        }

        const nextState = applyDocumentStatus(documentRecord, status);

        if (
          nextState === WORKFLOW_STATES.READY_FOR_RESULTS ||
          nextState === WORKFLOW_STATES.REVIEW_REQUIRED
        ) {
          scrollToResults();
        }
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        if (error instanceof ApiClientError && error.code === "UNAUTHORIZED") {
          handleSessionExpired();
          return;
        }

        setWorkflowState(WORKFLOW_STATES.PROCESSING_FAILED);
        setErrorMessage(userFacingMessage(error, translateActive));
      } finally {
        uploadInFlightRef.current = false;
        pollAbortRef.current = null;
      }
    },
    [applyDocumentStatus, handleSessionExpired, scrollToResults]
  );

  const acceptFile = useCallback(
    (file) => {
      const validation = validateSelectedFile(file);
      if (!validation.valid) {
        setSelectedFile(file);
        setErrorMessage(null);
        setWorkflowState(
          validation.reason === "file_too_large"
            ? WORKFLOW_STATES.FILE_TOO_LARGE
            : validation.reason === "idle"
              ? WORKFLOW_STATES.IDLE
              : WORKFLOW_STATES.UNSUPPORTED_FILE
        );
        return;
      }

      if (activeDocument) {
        setReplacePrompt(file);
        return;
      }

      setSelectedFile(file);
      setErrorMessage(null);
      setWorkflowState(WORKFLOW_STATES.FILE_READY);
    },
    [activeDocument]
  );

  const confirmReplace = useCallback(async () => {
    const file = replacePrompt;
    if (!file) {
      return;
    }

    stopPolling();
    setReplacePrompt(null);

    if (activeDocument?.id) {
      try {
        await deleteDocument(activeDocument.id);
      } catch (error) {
        if (!(error instanceof ApiClientError && error.status === 404)) {
          setErrorMessage(userFacingMessage(error, translateActive));
          return;
        }
      }
    }

    stopSpeaking();
    clearWorkspace();
    setSelectedFile(file);
    setWorkflowState(WORKFLOW_STATES.FILE_READY);
  }, [activeDocument, clearWorkspace, replacePrompt, stopPolling]);

  const cancelReplace = useCallback(() => {
    setReplacePrompt(null);
  }, []);

  const handleUploadClick = useCallback(() => {
    if (!selectedFile || uploadInFlightRef.current) {
      return;
    }
    beginUpload(selectedFile);
  }, [beginUpload, selectedFile]);

  const handleReset = useCallback(() => {
    stopPolling();
    stopSpeaking();
    clearAccessToken();
    setSelectedFile(null);
    clearWorkspace();
    setWorkflowState(WORKFLOW_STATES.IDLE);
  }, [clearWorkspace, stopPolling]);

  const retryUpload = useCallback(() => {
    if (!selectedFile) {
      clearAccessToken();
      setWorkflowState(WORKFLOW_STATES.IDLE);
      setErrorMessage(null);
      return;
    }
    setErrorMessage(null);
    beginUpload(selectedFile);
  }, [beginUpload, selectedFile]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  return {
    workflowState,
    setWorkflowState,
    selectedFile,
    activeDocument,
    statusSnapshot,
    uploadProgress,
    errorMessage,
    replacePrompt,
    resultsRef,
    acceptFile,
    handleUploadClick,
    handleReset,
    retryUpload,
    confirmReplace,
    cancelReplace,
    handleSessionExpired,
  };
}
