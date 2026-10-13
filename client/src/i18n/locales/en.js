/** @type {Record<string, string>} */
export const en = {
  "app.name": "DischargeCare",
  "app.tagline": "From hospital to home — organize discharge instructions",
  "app.footer":
    "DischargeCare helps caregivers organize information from a hospital discharge summary. It does not replace medical advice. Always confirm instructions with a qualified healthcare professional.",
  "app.language.label": "Language",
  "app.language.en": "English",
  "app.language.hi": "हिन्दी",

  "home.eyebrow": "Caregiver dashboard",
  "home.title": "Welcome to your care journey",
  "home.lead":
    "Organize discharge instructions, daily tasks, follow-ups, and questions about your hospital paperwork — starting with a secure upload.",

  "upload.heading": "Upload your discharge summary",
  "upload.step": "Step 1",
  "upload.intro":
    "Add a PDF or clear photo of your hospital discharge paperwork. Files are sent to the DischargeCare server for text extraction. Client-side checks improve the experience but do not guarantee file safety — the server validates every upload.",
  "upload.localModeNotice":
    "Running in device-only mode: data stays in this browser tab (no database). PDF/image extraction needs the server; plain .txt files can be reviewed locally.",
  "upload.dropTitle": "Drag and drop your file here",
  "upload.dropHint": "or use Browse Files",
  "upload.browse": "Browse Files",
  "upload.submit": "Upload document",
  "upload.supported": "Supported: {formats} · Max {maxMb} MB",
  "upload.uploading": "Uploading…",
  "upload.uploadingPercent": "Uploading… {percent}%",
  "upload.processing": "Processing on server…",
  "upload.privacyTitle": "Privacy notice",
  "upload.privacyBody":
    "Your file is sent over HTTPS to the DischargeCare server for this session only. Do not share discharge summaries on untrusted networks. Remove files from shared devices when you are finished reviewing care instructions.",
  "upload.nextTitle": "What happens next",
  "upload.next1": "Text is extracted from your PDF or image.",
  "upload.next2":
    "You review medicines, care tasks, and follow-ups with source references.",
  "upload.next3": "You can ask questions grounded in your document only.",
  "upload.designPreview": "Design preview (no data):",
  "upload.previewDashboard": "Results dashboard layout",
  "upload.previewNoExtraction": "No extraction",
  "upload.previewUnclear": "Unclear extraction",
  "upload.fileReadyTitle": "File ready",
  "upload.fileReadyBody":
    "Selected: {name} ({sizeKb} KB). Choose Upload document when you are ready.",
  "upload.clearSelection": "Clear selection",
  "upload.unsupportedTitle": "Unsupported file",
  "upload.unsupportedBody": "Please choose a PDF, JPG, PNG, or WebP file.",
  "upload.tryAgain": "Try again",
  "upload.tooLargeTitle": "File too large",
  "upload.tooLargeBody": "The file exceeds the {maxMb} MB limit.",
  "upload.chooseSmaller": "Choose a smaller file",
  "upload.failedTitle": "Upload or processing failed",
  "upload.failedDefault":
    "The document could not be processed. You can try again or choose a different file.",
  "upload.retryUpload": "Retry upload",
  "upload.sessionTitle": "Session expired",
  "upload.sessionDefault":
    "Your secure session ended. Start a new upload to continue.",
  "upload.startOver": "Start over",

  "dialog.replaceTitle": "Replace current document?",
  "dialog.replaceDescription":
    "Uploading a new file will delete the previous discharge summary from this browser session and clear any in-progress review. This cannot be undone.",
  "dialog.replaceConfirm": "Replace document",
  "dialog.replaceCancel": "Keep current",

  "session.expiredBanner":
    "Your session expired. Medical details were cleared from this screen. Upload again to start a new secure session.",

  "errors.cancelled": "The request was cancelled.",
  "errors.generic": "Something went wrong. Check your connection and try again.",
  "errors.UNAUTHORIZED":
    "Your session expired. Upload again to start a new secure session.",
  "errors.FILE_TOO_LARGE": "This file exceeds the server size limit.",
  "errors.UNSUPPORTED_MEDIA_TYPE": "This file type is not supported.",
  "errors.FILE_REQUIRED": "Choose a file before uploading.",
  "errors.EMPTY_FILE": "The selected file is empty.",
  "errors.INVALID_UPLOAD":
    "The upload could not be processed. Try again with a different file.",
  "errors.DOCUMENT_BUSY": "This document is still processing. Please wait.",
  "errors.SOURCE_TEXT_UNAVAILABLE":
    "Readable text is required before structured extraction.",
  "errors.EXTRACTION_IN_PROGRESS":
    "Extraction is already running for this document.",
  "errors.CLARIFICATIONS_OPEN":
    "Resolve open clarifications before marking the plan ready.",
  "errors.CLARIFICATION_RESOLUTION_REQUIRED":
    "A documented resolution note is required for this clarification.",
  "errors.DOCUMENT_PROCESSING":
    "Your document is still processing. Try chat again shortly.",
  "errors.DOCUMENT_UNAVAILABLE":
    "This document cannot be used for chat yet.",
  "errors.DOCUMENT_NO_TEXT": "This document cannot be used for chat yet.",
  "errors.EXTRACTION_PROCESSING":
    "Extraction is still running. Try chat again later.",
  "errors.EXTRACTION_FAILED":
    "Extraction failed for this document. Chat may be unavailable.",
  "errors.AI_PROVIDER_UNAVAILABLE":
    "The question service is unavailable. No answer was generated.",
  "errors.AI_CREDENTIALS_MISSING":
    "The question service is unavailable. No answer was generated.",
  "errors.AI_TIMEOUT": "The question timed out. Please try again.",
  "errors.REQUEST_FAILED": "Request failed.",
  "errors.missingTranslation": "[{key}]",

  "chat.title": "Ask DischargeCare",
  "chat.description":
    "Answers use your uploaded discharge summary only — not general medical advice.",
  "chat.unavailableTitle": "Chat unavailable",
  "chat.unavailableBody":
    "Upload and process a readable discharge summary to ask document-grounded questions.",
  "chat.emptyHint":
    "Ask a question about your discharge summary. If the document does not contain an answer, DischargeCare will say so — nothing is invented.",
  "chat.clear": "Clear chat",
  "chat.sending": "Sending…",
  "chat.inputLabel": "Question about discharge summary",
  "chat.placeholder": "Ask about your document…",
  "chat.placeholderUnavailable": "Chat unavailable",
  "chat.send": "Send",
  "chat.failedTitle": "Message failed",
  "chat.retry": "Retry",
  "chat.disclaimer":
    "Not medical advice. Citations appear only when the server validates them against your document. Read aloud uses your browser's text-to-speech; machine translation is not clinically validated.",
  "chat.answer.answered": "Answered from document",
  "chat.answer.insufficient_information": "Not enough information in document",
  "chat.answer.error": "Could not generate a safe answer",
  "chat.suggested.medicines": "What medicines are mentioned in my discharge summary?",
  "chat.suggested.food": "Should any medicine be taken with or after food?",
  "chat.suggested.warnings": "What warning signs should I watch for?",
  "chat.suggested.followups": "Are any follow-up appointments documented?",

  "speech.readAloud": "Read aloud",
  "speech.stop": "Stop speaking",
  "speech.unsupported": "Read aloud is not supported in this browser.",
  "speech.noVoice":
    "No suitable voice found for {language}. The browser may still attempt default speech.",

  "results.designPreview": "Design preview — not live data",
  "results.dashboardTitle": "Care journey dashboard",
  "results.backToUpload": "Back to upload",
  "results.noExtractionTitle": "No extracted information (preview)",
  "results.noExtractionBody":
    "When the file has no readable text, you may be prompted to upload a clearer copy.",
  "results.unclearTitle": "Unclear extraction (preview)",
  "results.unclearBody":
    "Some instructions may need professional confirmation before you rely on them.",
  "results.reviewRequiredTitle": "Document text needs review",
  "results.reviewRequiredBody":
    "Text extraction completed with issues. Confirm instructions with your care team before relying on them.",
  "results.processingFailedTitle": "Document processing failed",
  "results.processingFailedBody":
    "Care plan results are unavailable until processing succeeds.",
  "results.uploadAnother": "Upload another document",

  "tasks.title": "Daily care tasks",
  "tasks.description":
    "Checkboxes save through the server. This is not clinical verification.",
  "tasks.progress":
    "{completed} completed · {remaining} remaining{skippedPart} of {total} tasks",
  "tasks.skippedPart": " · {skipped} skipped",
  "tasks.status.completed": "Completed (your report)",
  "tasks.status.skipped": "Skipped",
  "tasks.status.pending": "Pending",
  "tasks.markComplete": "Mark complete",
  "tasks.markSkipped": "Skip",
  "tasks.trackInstruction": "Track as task",
  "tasks.empty": "No tasks yet. Track instructions from your document or add tasks later.",

  "followups.title": "Follow-up appointments",
  "followups.description":
    "Extracted details are shown as documented. You may add caregiver-entered follow-ups without inventing clinical details.",
  "followups.add": "Add caregiver follow-up",
  "followups.empty": "No follow-ups documented",

  "clarifications.title": "Clarifications",
  "clarifications.description":
    "Recording resolution requires a written note. Clicking alone does not confirm medical advice.",

  "dashboard.overview": "Care plan overview",
  "dashboard.sessionExpired": "Session expired",
  "dashboard.loadError": "Could not load care plan",

  "extraction.food.before_food": "Before food",
  "extraction.food.after_food": "After food",
  "extraction.food.with_food": "With food",
  "extraction.food.empty_stomach": "Empty stomach",
  "extraction.food.not_specified": "Not specified in the document",
  "extraction.notSpecified": "Not specified in the document",
  "extraction.review.confirmed_against_source": "Confirmed against source",
  "extraction.review.needs_clarification": "Needs clarification",
  "extraction.review.unreviewed": "Not yet reviewed",
};
