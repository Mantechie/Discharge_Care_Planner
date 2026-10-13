import { WORKFLOW_STATES } from "../constants/upload.js";

export function mapBackendStatusToWorkflow(backendStatus) {
  switch (backendStatus) {
    case "uploaded":
      return WORKFLOW_STATES.UPLOADED;
    case "processing":
      return WORKFLOW_STATES.PROCESSING;
    case "review_required":
      return WORKFLOW_STATES.REVIEW_REQUIRED;
    case "ready":
      return WORKFLOW_STATES.READY_FOR_RESULTS;
    case "failed":
      return WORKFLOW_STATES.PROCESSING_FAILED;
    default:
      return WORKFLOW_STATES.PROCESSING;
  }
}

export function shouldShowResultsSection(workflowState) {
  return (
    workflowState === WORKFLOW_STATES.READY_FOR_RESULTS ||
    workflowState === WORKFLOW_STATES.REVIEW_REQUIRED ||
    workflowState === WORKFLOW_STATES.NO_EXTRACTION
  );
}

export function isDesignPreviewState(workflowState) {
  return (
    workflowState === WORKFLOW_STATES.PREVIEW_DASHBOARD ||
    workflowState === WORKFLOW_STATES.NO_EXTRACTION ||
    workflowState === WORKFLOW_STATES.UNCLEAR_EXTRACTION
  );
}
