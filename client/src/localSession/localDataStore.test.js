import { describe, expect, it, beforeEach } from "vitest";
import {
  clearLocalDataStore,
  createLocalDocument,
  advanceLocalDocumentStatus,
  getExtractionBundle,
  deleteLocalDocument,
} from "./localDataStore.js";

describe("localDataStore", () => {
  beforeEach(() => {
    clearLocalDataStore();
  });

  it("keeps document text in memory without persisting to storage APIs", async () => {
    const file = new File(["Take medicine at 8am"], "discharge.txt", {
      type: "text/plain",
    });
    const record = await createLocalDocument(file);
    advanceLocalDocumentStatus(record.id);
    const bundle = getExtractionBundle(record.id);
    expect(bundle.extraction.documentId).toBe(record.id);
    expect(record.hasReadableText).toBe(true);
    deleteLocalDocument(record.id);
    expect(getExtractionBundle(record.id)).toBeNull();
  });
});
