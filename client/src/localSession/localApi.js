import { ApiClientError } from "../api/errors.js";
import {
  advanceLocalDocumentStatus,
  appendChat,
  clearChat,
  clearLocalDataStore,
  createFollowUpLocal,
  createLocalDocument,
  createTaskLocal,
  deleteLocalDocument,
  getCarePlan,
  getChatHistory,
  getDocumentRecord,
  getDocumentSource,
  getDocumentStatus,
  getExtractionBundle,
  getFileBlob,
  listClarifications,
  listFollowUpsForPlan,
  listTasksForPlan,
  patchCarePlanLocal,
  resolveClarificationLocal,
  updateFollowUpLocal,
  updateTaskLocal,
} from "./localDataStore.js";

function ok(data, message = "OK") {
  return { data, message };
}

function notFound(message = "Not found.") {
  throw new ApiClientError(message, { code: "NOT_FOUND", status: 404 });
}

function parsePath(path) {
  const clean = path.replace(/^\//, "").split("?")[0];
  return clean.split("/").filter(Boolean);
}

export function resetLocalSession() {
  clearLocalDataStore();
}

export async function localApiFetch(path, options = {}) {
  const { method = "GET", body } = options;
  const segments = parsePath(path);

  if (segments[0] === "auth" && segments[1] === "anonymous-session" && method === "POST") {
    return ok({
      accessToken: "local-in-memory-session",
      tokenType: "Bearer",
      expiresIn: 86400,
      user: { id: "local-user", isAnonymous: true },
    });
  }

  if (segments[0] === "documents") {
    const documentId = segments[1];
    if (!documentId) {
      notFound();
    }

    if (segments[2] === "status" && method === "GET") {
      const status = getDocumentStatus(documentId);
      if (!status) {
        notFound();
      }
      return ok(status);
    }

    if (segments[2] === "source" && method === "GET") {
      const source = getDocumentSource(documentId);
      if (!source) {
        notFound();
      }
      return ok(source);
    }

    if (segments[2] === "extraction" && method === "GET") {
      const bundle = getExtractionBundle(documentId);
      if (!bundle) {
        notFound();
      }
      return ok(bundle);
    }

    if (segments[2] === "extract" && method === "POST") {
      const bundle = getExtractionBundle(documentId);
      if (!bundle) {
        notFound();
      }
      return ok(bundle);
    }

    if (segments[2] === "reprocess-extraction" && method === "POST") {
      const bundle = getExtractionBundle(documentId);
      if (!bundle) {
        notFound();
      }
      return ok(bundle);
    }

    if (method === "GET" && segments.length === 2) {
      const record = getDocumentRecord(documentId);
      if (!record) {
        notFound();
      }
      return ok(record);
    }

    if (method === "DELETE" && segments.length === 2) {
      if (!deleteLocalDocument(documentId)) {
        notFound();
      }
      return ok({ id: documentId });
    }
  }

  if (segments[0] === "care-plans") {
    const carePlanId = segments[1];
    if (!carePlanId) {
      notFound();
    }

    if (segments[2] === "clarifications" && segments[3] && method === "PATCH") {
      const updated = resolveClarificationLocal(carePlanId, segments[3], body);
      if (!updated) {
        notFound();
      }
      return ok(updated);
    }

    if (segments[2] === "clarifications" && method === "GET") {
      return ok(listClarifications(carePlanId));
    }

    if (segments[2] === "review" && method === "POST") {
      return ok({ recorded: true });
    }

    if (method === "PATCH") {
      const plan = patchCarePlanLocal(carePlanId, body);
      if (!plan) {
        notFound();
      }
      return ok(plan);
    }

    if (method === "GET") {
      const plan = getCarePlan(carePlanId);
      if (!plan) {
        notFound();
      }
      return ok(plan);
    }
  }

  if (segments[0] === "tasks") {
    if (method === "GET") {
      const carePlanId = new URLSearchParams(path.split("?")[1] || "").get("carePlanId");
      if (!carePlanId) {
        return ok({ items: [], total: 0 });
      }
      return ok(listTasksForPlan(carePlanId));
    }
    if (method === "POST") {
      return ok(createTaskLocal(body));
    }
    if (method === "PATCH" && segments[1]) {
      const updated = updateTaskLocal(segments[1], body);
      if (!updated) {
        notFound();
      }
      return ok(updated);
    }
  }

  if (segments[0] === "follow-ups") {
    if (method === "GET") {
      const carePlanId = new URLSearchParams(path.split("?")[1] || "").get("carePlanId");
      if (!carePlanId) {
        return ok({ items: [], total: 0 });
      }
      return ok(listFollowUpsForPlan(carePlanId));
    }
    if (method === "POST") {
      return ok(createFollowUpLocal(body));
    }
    if (method === "PATCH" && segments[1]) {
      const updated = updateFollowUpLocal(segments[1], body);
      if (!updated) {
        notFound();
      }
      return ok(updated);
    }
  }

  if (segments[0] === "chat") {
    if (method === "POST") {
      const { documentId, message, language } = body || {};
      const userMsg = {
        id: `local-user-${Date.now()}`,
        role: "user",
        message,
        language: language || "en",
        createdAt: new Date().toISOString(),
      };
      const assistantMsg = {
        id: `local-assistant-${Date.now()}`,
        role: "assistant",
        message:
          "Local mode: answers are not generated from AI. Upload a .txt discharge summary to review text on this device only, or connect the server for full extraction and chat.",
        language: language || "en",
        answerStatus: "insufficient_information",
        sourceReferences: [],
        createdAt: new Date().toISOString(),
      };
      appendChat(documentId, [userMsg, assistantMsg]);
      return ok({
        messageId: assistantMsg.id,
        answer: assistantMsg.message,
        language: assistantMsg.language,
        answerStatus: assistantMsg.answerStatus,
        citations: [],
        requiresProfessionalConfirmation: true,
      });
    }

    if (segments[0] === "chat" && path.includes("history")) {
      const params = new URLSearchParams(path.split("?")[1] || "");
      const documentId = params.get("documentId");
      if (method === "DELETE") {
        clearChat(documentId);
        return ok({ cleared: true });
      }
      const items = getChatHistory(documentId);
      return ok({ items, total: items.length });
    }
  }

  throw new ApiClientError("Local API route not implemented.", {
    code: "REQUEST_FAILED",
    status: 501,
  });
}

export function localUploadDocument(file, { onProgress, signal }) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const steps = [10, 40, 70, 100];
    let index = 0;

    const tick = async () => {
      if (signal?.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }

      if (index < steps.length) {
        onProgress?.(steps[index]);
        index += 1;
        setTimeout(tick, index === 1 ? 80 : 120);
        return;
      }

      try {
        const record = await createLocalDocument(file);
        setTimeout(() => {
          advanceLocalDocumentStatus(record.id);
          const { fileBlob, sourceText, sourcePages, ...data } =
            getDocumentRecord(record.id) || record;
          resolve({
            status: 201,
            data,
            message: "Uploaded locally (in-memory only).",
          });
        }, 150);
      } catch (error) {
        reject(error);
      }
    };

    tick();
  });
}

export async function localFetchDocumentFileBlob(documentId) {
  const file = getFileBlob(documentId);
  if (!file) {
    notFound();
  }
  return file;
}
