import { describe, expect, it } from "vitest";
import {
  mapBackendStatusToWorkflow,
  shouldShowResultsSection,
} from "./mapDocumentStatus.js";
import { WORKFLOW_STATES } from "../constants/upload.js";

describe("mapBackendStatusToWorkflow", () => {
  it("maps backend statuses to workflow states", () => {
    expect(mapBackendStatusToWorkflow("ready")).toBe(
      WORKFLOW_STATES.READY_FOR_RESULTS
    );
    expect(mapBackendStatusToWorkflow("review_required")).toBe(
      WORKFLOW_STATES.REVIEW_REQUIRED
    );
    expect(mapBackendStatusToWorkflow("processing")).toBe(
      WORKFLOW_STATES.PROCESSING
    );
    expect(mapBackendStatusToWorkflow("failed")).toBe(
      WORKFLOW_STATES.PROCESSING_FAILED
    );
  });
});

describe("shouldShowResultsSection", () => {
  it("shows results for ready and review states", () => {
    expect(shouldShowResultsSection(WORKFLOW_STATES.READY_FOR_RESULTS)).toBe(
      true
    );
    expect(shouldShowResultsSection(WORKFLOW_STATES.REVIEW_REQUIRED)).toBe(
      true
    );
    expect(shouldShowResultsSection(WORKFLOW_STATES.UPLOADING)).toBe(false);
  });
});
