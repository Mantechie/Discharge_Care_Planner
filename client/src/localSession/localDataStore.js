/** In-memory session data only — no MongoDB, localStorage, or IndexedDB. */

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

const emptyStore = () => ({
  documents: new Map(),
  carePlans: new Map(),
  tasks: new Map(),
  followUps: new Map(),
  clarifications: new Map(),
  chatByDocument: new Map(),
});

let store = emptyStore();

export function clearLocalDataStore() {
  store = emptyStore();
}

export function getLocalDocument(documentId) {
  return store.documents.get(documentId);
}

function ensureCarePlan(documentId) {
  const doc = store.documents.get(documentId);
  if (!doc) {
    return null;
  }
  if (!doc.carePlanId) {
    const carePlanId = createId("plan");
    const plan = {
      id: carePlanId,
      documentId,
      status: "ready",
      medications: [],
      dailyCareInstructions: [],
      followUpAppointments: [],
      warningSigns: [],
      caregiverEdits: { medications: [] },
    };
    store.carePlans.set(carePlanId, plan);
    doc.carePlanId = carePlanId;
  }
  return store.carePlans.get(doc.carePlanId);
}

async function readSourceTextFromFile(file) {
  if (file.type.startsWith("text/") || file.name.endsWith(".txt")) {
    try {
      const text = await file.text();
      return text.trim() || null;
    } catch {
      return null;
    }
  }
  return null;
}

function buildSourcePages(text) {
  if (!text) {
    return [];
  }
  const chunkSize = 2000;
  const pages = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    pages.push({
      pageNumber: pages.length + 1,
      text: text.slice(i, i + chunkSize),
    });
  }
  return pages.length ? pages : [{ pageNumber: 1, text }];
}

export async function createLocalDocument(file) {
  const id = createId("doc");
  const sourceText = await readSourceTextFromFile(file);
  const hasReadableText = Boolean(sourceText);

  const record = {
    id,
    originalFilename: file.name,
    mimeType: file.type || "application/octet-stream",
    fileSize: file.size,
    status: "processing",
    extractionMethod: "local_browser",
    pageCount: hasReadableText ? buildSourcePages(sourceText).length : null,
    hasReadableText,
    processingErrors: hasReadableText ? [] : ["LOCAL_NO_TEXT_EXTRACTOR"],
    fileBlob: file,
    sourceText,
    sourcePages: buildSourcePages(sourceText),
    carePlanId: null,
    aiExtractionStatus: hasReadableText ? "completed" : "failed",
    createdAt: new Date().toISOString(),
  };

  store.documents.set(id, record);
  ensureCarePlan(id);

  return record;
}

export function advanceLocalDocumentStatus(documentId) {
  const doc = store.documents.get(documentId);
  if (!doc) {
    return null;
  }
  if (doc.status === "processing") {
    doc.status = doc.hasReadableText ? "ready" : "review_required";
  }
  return {
    status: doc.status,
    id: doc.id,
    extractionMethod: doc.extractionMethod,
    pageCount: doc.pageCount,
    hasReadableText: doc.hasReadableText,
    processingErrors: doc.processingErrors,
  };
}

export function deleteLocalDocument(documentId) {
  const doc = store.documents.get(documentId);
  if (!doc) {
    return false;
  }
  if (doc.carePlanId) {
    const planId = doc.carePlanId;
    for (const [taskId, task] of store.tasks) {
      if (task.carePlanId === planId) {
        store.tasks.delete(taskId);
      }
    }
    for (const [followUpId, followUp] of store.followUps) {
      if (followUp.carePlanId === planId) {
        store.followUps.delete(followUpId);
      }
    }
    for (const [clarId, clar] of store.clarifications) {
      if (clar.carePlanId === planId) {
        store.clarifications.delete(clarId);
      }
    }
    store.carePlans.delete(planId);
  }
  store.chatByDocument.delete(documentId);
  store.documents.delete(documentId);
  return true;
}

export function getDocumentStatus(documentId) {
  const doc = store.documents.get(documentId);
  if (!doc) {
    return null;
  }
  return {
    status: doc.status,
    id: doc.id,
    extractionMethod: doc.extractionMethod,
    pageCount: doc.pageCount,
    hasReadableText: doc.hasReadableText,
    processingErrors: doc.processingErrors || [],
  };
}

export function getDocumentRecord(documentId) {
  const doc = store.documents.get(documentId);
  if (!doc) {
    return null;
  }
  const { fileBlob, sourceText, sourcePages, ...rest } = doc;
  return rest;
}

export function getDocumentSource(documentId) {
  const doc = store.documents.get(documentId);
  if (!doc) {
    return null;
  }
  return {
    documentId,
    pages: doc.sourcePages || [],
    hasReadableText: doc.hasReadableText,
  };
}

export function getExtractionBundle(documentId) {
  const doc = store.documents.get(documentId);
  if (!doc) {
    return null;
  }
  const plan = ensureCarePlan(documentId);
  return {
    aiExtractionStatus: doc.aiExtractionStatus,
    carePlanId: plan.id,
    extraction: plan,
  };
}

export function getCarePlan(carePlanId) {
  return store.carePlans.get(carePlanId) || null;
}

export function patchCarePlanLocal(carePlanId, body) {
  const plan = store.carePlans.get(carePlanId);
  if (!plan) {
    return null;
  }
  Object.assign(plan, body);
  return plan;
}

export function listClarifications(carePlanId) {
  return [...store.clarifications.values()].filter((c) => c.carePlanId === carePlanId);
}

export function resolveClarificationLocal(carePlanId, clarificationId, body) {
  const item = store.clarifications.get(clarificationId);
  if (!item || item.carePlanId !== carePlanId) {
    return null;
  }
  Object.assign(item, body, { status: body.status || "resolved" });
  return item;
}

export function listTasksForPlan(carePlanId) {
  const items = [...store.tasks.values()].filter((t) => t.carePlanId === carePlanId);
  return { items, total: items.length };
}

export function createTaskLocal(body) {
  const id = createId("task");
  const task = {
    id,
    status: "pending",
    ...body,
  };
  store.tasks.set(id, task);
  return task;
}

export function updateTaskLocal(taskId, body) {
  const task = store.tasks.get(taskId);
  if (!task) {
    return null;
  }
  Object.assign(task, body);
  return task;
}

export function listFollowUpsForPlan(carePlanId) {
  const items = [...store.followUps.values()].filter((f) => f.carePlanId === carePlanId);
  return { items, total: items.length };
}

export function createFollowUpLocal(body) {
  const id = createId("followup");
  const followUp = { id, ...body };
  store.followUps.set(id, followUp);
  return followUp;
}

export function updateFollowUpLocal(followUpId, body) {
  const followUp = store.followUps.get(followUpId);
  if (!followUp) {
    return null;
  }
  Object.assign(followUp, body);
  return followUp;
}

export function getChatHistory(documentId) {
  return store.chatByDocument.get(documentId) || [];
}

export function appendChat(documentId, entries) {
  const list = store.chatByDocument.get(documentId) || [];
  store.chatByDocument.set(documentId, [...list, ...entries]);
}

export function clearChat(documentId) {
  store.chatByDocument.delete(documentId);
}

export function getFileBlob(documentId) {
  const doc = store.documents.get(documentId);
  if (!doc?.fileBlob) {
    return null;
  }
  return {
    blob: doc.fileBlob,
    contentType: doc.mimeType,
  };
}
