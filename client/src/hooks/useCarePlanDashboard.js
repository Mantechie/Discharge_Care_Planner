import { useCallback, useEffect, useRef, useState } from "react";
import { fetchExtraction } from "../api/extraction.js";
import {
  fetchCarePlan,
  fetchCarePlanClarifications,
  resolveClarification,
} from "../api/carePlans.js";
import { listTasks, updateTask, createTask } from "../api/tasks.js";
import { listFollowUps, createFollowUp, updateFollowUp } from "../api/followUps.js";
import { ApiClientError, userFacingMessage } from "../api/errors.js";
import { translateActive } from "../i18n/runtimeTranslator.js";
import { stopSpeaking } from "../speech/textToSpeech.js";
import { nextTaskStatus } from "../utils/taskProgress.js";

export const DASHBOARD_LOAD_STATE = {
  IDLE: "idle",
  LOADING: "loading",
  READY: "ready",
  NO_CARE_PLAN: "no_care_plan",
  REVIEW_REQUIRED: "review_required",
  ERROR: "error",
  SESSION_EXPIRED: "session_expired",
};

function defaultTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
  } catch {
    return "Asia/Kolkata";
  }
}

export function useCarePlanDashboard(documentId) {
  const [loadState, setLoadState] = useState(DASHBOARD_LOAD_STATE.IDLE);
  const [carePlan, setCarePlan] = useState(null);
  const [carePlanId, setCarePlanId] = useState(null);
  const [aiExtractionStatus, setAiExtractionStatus] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [clarifications, setClarifications] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [savingFollowUpId, setSavingFollowUpId] = useState(null);
  const [creatingFollowUp, setCreatingFollowUp] = useState(false);
  const [creatingTaskKey, setCreatingTaskKey] = useState(null);
  const [resolvingClarificationId, setResolvingClarificationId] = useState(null);

  const abortRef = useRef(null);
  const loadedForDocumentRef = useRef(null);

  const reloadTasks = useCallback(async (planId, signal) => {
    const taskResult = await listTasks({ carePlanId: planId, limit: 100 }, signal);
    setTasks(taskResult.items || []);
  }, []);

  const reloadFollowUps = useCallback(async (planId, signal) => {
    const followUpResult = await listFollowUps(
      { carePlanId: planId, limit: 100 },
      signal
    );
    setFollowUps(followUpResult.items || []);
  }, []);

  const reloadClarifications = useCallback(async (planId, signal) => {
    const items = await fetchCarePlanClarifications(planId, signal);
    setClarifications(items || []);
  }, []);

  const loadDashboard = useCallback(async (signal) => {
    if (!documentId) {
      setLoadState(DASHBOARD_LOAD_STATE.IDLE);
      setCarePlan(null);
      setCarePlanId(null);
      setTasks([]);
      setFollowUps([]);
      setClarifications([]);
      return;
    }

    setLoadState(DASHBOARD_LOAD_STATE.LOADING);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const extractionBundle = await fetchExtraction(documentId, signal);
      setAiExtractionStatus(extractionBundle.aiExtractionStatus);

      const plan =
        extractionBundle.extraction ||
        (await fetchCarePlan(extractionBundle.carePlanId, signal));

      const planId = plan.id || extractionBundle.carePlanId;
      setCarePlan(plan);
      setCarePlanId(planId);

      await Promise.all([
        reloadTasks(planId, signal),
        reloadFollowUps(planId, signal),
        reloadClarifications(planId, signal),
      ]);

      loadedForDocumentRef.current = documentId;

      if (plan.status === "review_required") {
        setLoadState(DASHBOARD_LOAD_STATE.REVIEW_REQUIRED);
      } else {
        setLoadState(DASHBOARD_LOAD_STATE.READY);
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      if (error instanceof ApiClientError) {
        if (error.code === "UNAUTHORIZED") {
          setLoadState(DASHBOARD_LOAD_STATE.SESSION_EXPIRED);
          setErrorMessage(userFacingMessage(error, translateActive));
          setTasks([]);
          setFollowUps([]);
          setClarifications([]);
          return;
        }
        if (error.status === 404) {
          setLoadState(DASHBOARD_LOAD_STATE.NO_CARE_PLAN);
          setCarePlan(null);
          setCarePlanId(null);
          setTasks([]);
          setFollowUps([]);
          setClarifications([]);
          return;
        }
      }

      setLoadState(DASHBOARD_LOAD_STATE.ERROR);
      setErrorMessage(userFacingMessage(error, translateActive));
    }
  }, [
    documentId,
    reloadClarifications,
    reloadFollowUps,
    reloadTasks,
  ]);

  useEffect(() => {
    if (!documentId) {
      return undefined;
    }

    if (loadedForDocumentRef.current && loadedForDocumentRef.current !== documentId) {
      setCarePlan(null);
      setCarePlanId(null);
      setTasks([]);
      setFollowUps([]);
      setClarifications([]);
    }

    stopSpeaking();
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    loadDashboard(controller.signal);

    return () => controller.abort();
  }, [documentId, loadDashboard]);

  const updateTaskStatus = useCallback(
    async (task, action) => {
      if (!task?.id || updatingTaskId) {
        return;
      }

      const nextStatus = nextTaskStatus(task.status, action);
      setUpdatingTaskId(task.id);
      setErrorMessage(null);
      setStatusMessage(null);

      try {
        const updated = await updateTask(task.id, { status: nextStatus });
        setTasks((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        if (carePlanId) {
          await reloadTasks(carePlanId);
        }
        setStatusMessage(
          "Task updated. Completion reflects your report, not clinical verification."
        );
      } catch (error) {
        setErrorMessage(userFacingMessage(error, translateActive));
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [carePlanId, reloadTasks, updatingTaskId]
  );

  const toggleTaskComplete = useCallback(
    (task) => updateTaskStatus(task, "complete"),
    [updateTaskStatus]
  );

  const toggleTaskSkipped = useCallback(
    (task) => updateTaskStatus(task, "skip"),
    [updateTaskStatus]
  );

  const trackInstructionAsTask = useCallback(
    async (instructionItem, index) => {
      if (!carePlanId || !documentId || creatingTaskKey) {
        return;
      }

      const key = instructionItem.id || `instruction-${index}`;
      setCreatingTaskKey(key);
      setErrorMessage(null);

      try {
        const created = await createTask({
          carePlanId,
          documentId,
          title: instructionItem.instruction.slice(0, 300),
          description: "Tracked from documented discharge instruction.",
          category: "care_instruction",
          timezone: defaultTimezone(),
          isSourceDerived: true,
          sourceReferences: (instructionItem.sourceReferences || []).map((ref) => ({
            pageNumber: ref.pageNumber ?? ref.page ?? null,
            quotedText: ref.quotedText ?? null,
            referencePrecision: ref.referencePrecision ?? "unavailable",
          })),
        });
        setTasks((prev) => [...prev, created]);
        await reloadTasks(carePlanId);
        setStatusMessage("Task created from your documented instruction.");
      } catch (error) {
        setErrorMessage(userFacingMessage(error, translateActive));
      } finally {
        setCreatingTaskKey(null);
      }
    },
    [carePlanId, creatingTaskKey, documentId, reloadTasks]
  );

  const markFollowUpStatus = useCallback(
    async (followUp, status) => {
      if (!followUp?.id || savingFollowUpId) {
        return;
      }

      setSavingFollowUpId(followUp.id);
      setErrorMessage(null);

      try {
        const updated = await updateFollowUp(followUp.id, { status });
        setFollowUps((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        setStatusMessage("Follow-up status saved.");
      } catch (error) {
        setErrorMessage(userFacingMessage(error, translateActive));
      } finally {
        setSavingFollowUpId(null);
      }
    },
    [savingFollowUpId]
  );

  const addCaregiverFollowUp = useCallback(
    async (draft) => {
      if (!carePlanId || !documentId || creatingFollowUp) {
        return { ok: false };
      }

      setCreatingFollowUp(true);
      setErrorMessage(null);

      try {
        const body = {
          carePlanId,
          documentId,
          title: draft.title.trim(),
          appointmentDate: draft.appointmentDate || null,
          appointmentTime: draft.appointmentTime || null,
          location: draft.location?.trim() || null,
          instructions: draft.instructions?.trim() || null,
          status: "upcoming",
          origin: "caregiver_entered",
        };
        const created = await createFollowUp(body);
        setFollowUps((prev) => [...prev, created]);
        setStatusMessage("Caregiver follow-up saved (not from extraction).");
        return { ok: true };
      } catch (error) {
        setErrorMessage(userFacingMessage(error, translateActive));
        return { ok: false };
      } finally {
        setCreatingFollowUp(false);
      }
    },
    [carePlanId, creatingFollowUp, documentId]
  );

  const submitClarificationResolution = useCallback(
    async (clarificationId, body) => {
      if (!carePlanId || resolvingClarificationId) {
        return { ok: false };
      }

      setResolvingClarificationId(clarificationId);
      setErrorMessage(null);

      try {
        await resolveClarification(carePlanId, clarificationId, body);
        await reloadClarifications(carePlanId);
        setStatusMessage(
          "Clarification recorded. This does not imply automatic clinical approval."
        );
        return { ok: true };
      } catch (error) {
        setErrorMessage(userFacingMessage(error, translateActive));
        return { ok: false };
      } finally {
        setResolvingClarificationId(null);
      }
    },
    [carePlanId, reloadClarifications, resolvingClarificationId]
  );

  const refresh = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    loadDashboard(controller.signal);
  }, [loadDashboard]);

  return {
    loadState,
    carePlan,
    carePlanId,
    aiExtractionStatus,
    tasks,
    followUps,
    clarifications,
    errorMessage,
    statusMessage,
    updatingTaskId,
    savingFollowUpId,
    creatingFollowUp,
    creatingTaskKey,
    resolvingClarificationId,
    toggleTaskComplete,
    toggleTaskSkipped,
    trackInstructionAsTask,
    markFollowUpStatus,
    addCaregiverFollowUp,
    submitClarificationResolution,
    refresh,
  };
}
