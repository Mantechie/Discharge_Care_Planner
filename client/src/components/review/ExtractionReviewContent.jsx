import { useState } from "react";
import { Card, SectionHeader } from "../ui/Card.jsx";
import { Alert } from "../ui/Alert.jsx";
import { Button } from "../ui/Button.jsx";
import { Badge } from "../ui/Badge.jsx";
import { EmptyState } from "../ui/EmptyState.jsx";
import { SourceReferenceList } from "./SourceReferenceList.jsx";
import {
  formatDocumentedValue,
  formatFoodInstruction,
  formatReviewStatus,
  isCarePlanReadyForContinue,
} from "../../utils/extractionLabels.js";
import { REVIEW_PHASE } from "../../hooks/useDocumentReview.js";

function MedicationReviewCard({
  medication,
  saving,
  onSaveCorrection,
  onSelectPage,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    dose: medication.display.dose || "",
    frequency: medication.display.frequency || "",
    timing: medication.display.timing || "",
    notes: medication.display.caregiverNotes || "",
  });

  const extracted = medication.extracted;

  return (
    <article className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="text-base font-semibold text-slate-900">
          {formatDocumentedValue(extracted.name)}
        </h4>
        <Badge tone="info">{formatReviewStatus(extracted.reviewStatus)}</Badge>
      </div>

      {medication.hasCaregiverEdits ? (
        <p className="mt-2 text-xs font-medium text-amber-800">
          Caregiver correction applied — original extraction shown below.
        </p>
      ) : null}

      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <Field label="Dose / strength" display={medication.display.dose} extracted={extracted.dose} />
        <Field label="Route" value={extracted.route} />
        <Field label="Frequency" display={medication.display.frequency} extracted={extracted.frequency} />
        <Field label="Exact time" display={medication.display.timing} extracted={extracted.timing} />
        <Field label="Duration" value={extracted.duration} />
        <div>
          <dt className="text-slate-500">Food instruction</dt>
          <dd className="font-medium text-slate-900">
            {formatFoodInstruction(extracted.foodInstruction)}
          </dd>
        </div>
      </dl>

      {extracted.clarificationReason ? (
        <Alert tone="warning" title="Needs confirmation" className="mt-3">
          {extracted.clarificationReason}
        </Alert>
      ) : null}

      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Source references
        </p>
        <SourceReferenceList
          references={extracted.sourceReferences}
          onSelectPage={onSelectPage}
        />
      </div>

      {editing ? (
        <form
          className="mt-4 space-y-2 rounded-lg border border-dashed border-slate-300 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSaveCorrection(medication.id, draft);
            setEditing(false);
          }}
        >
          <p className="text-xs text-slate-600">
            Corrections are saved separately and do not overwrite the original
            extraction.
          </p>
          {["dose", "frequency", "timing", "notes"].map((field) => (
            <label key={field} className="block text-sm">
              <span className="text-slate-600 capitalize">{field}</span>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={draft[field]}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, [field]: event.target.value }))
                }
              />
            </label>
          ))}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              Save correction
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          variant="ghost"
          className="mt-3"
          onClick={() => setEditing(true)}
        >
          Add caregiver correction
        </Button>
      )}
    </article>
  );
}

function Field({ label, value, display, extracted }) {
  const showOriginal =
    display !== undefined &&
    extracted !== undefined &&
    formatDocumentedValue(display) !== formatDocumentedValue(extracted);

  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">
        {formatDocumentedValue(display ?? value)}
      </dd>
      {showOriginal ? (
        <dd className="mt-1 text-xs text-slate-500">
          Extracted: {formatDocumentedValue(extracted)}
        </dd>
      ) : null}
    </div>
  );
}

function InstructionList({ items, labelKey, onSelectPage }) {
  if (!items?.length) {
    return (
      <EmptyState
        title="None documented"
        description="Nothing was extracted for this section from your summary."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={item.id || `${labelKey}-${index}`}
          className="rounded-lg border border-slate-200 p-3 text-sm"
        >
          <p className="font-medium text-slate-900">
            {formatDocumentedValue(item[labelKey] || item.instruction || item.description)}
          </p>
          {item.date !== undefined || item.time !== undefined || item.location !== undefined ? (
            <dl className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-3">
              <div>
                <dt>Date</dt>
                <dd className="font-medium text-slate-800">
                  {formatDocumentedValue(item.date)}
                </dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd className="font-medium text-slate-800">
                  {formatDocumentedValue(item.time)}
                </dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd className="font-medium text-slate-800">
                  {formatDocumentedValue(item.location)}
                </dd>
              </div>
            </dl>
          ) : null}
          <p className="mt-1 text-xs text-slate-500">
            {formatReviewStatus(item.reviewStatus)}
          </p>
          <SourceReferenceList
            references={item.sourceReferences}
            onSelectPage={onSelectPage}
          />
        </li>
      ))}
    </ul>
  );
}

export function ExtractionReviewContent({
  phase,
  extractionBundle,
  carePlan,
  documentRecord,
  statusSnapshot,
  selectedPage,
  onSelectPage,
  actionMessage,
  actionError,
  savingMedicationId,
  onRunExtract,
  onReextract,
  onMarkReviewed,
  onSaveMedicationCorrection,
  onResolveClarification,
  onContinue,
}) {
  const [reviewNote, setReviewNote] = useState("");
  const [resolutionDrafts, setResolutionDrafts] = useState({});

  if (phase === REVIEW_PHASE.LOADING || phase === REVIEW_PHASE.EXTRACTING) {
    return (
      <Alert tone="info" title="Loading extraction">
        {phase === REVIEW_PHASE.EXTRACTING
          ? "Structured extraction is running on the server…"
          : "Loading document review…"}
      </Alert>
    );
  }

  if (phase === REVIEW_PHASE.REEXTRACTING) {
    return (
      <Alert tone="info" title="Re-extraction in progress">
        A new extraction is being generated. Prior results remain archived on the
        server.
      </Alert>
    );
  }

  if (phase === REVIEW_PHASE.NO_READABLE_TEXT) {
    return (
      <Alert tone="warning" title="Source text unavailable">
        Readable text is required before structured extraction. Try uploading a
        clearer PDF or image, or use document reprocessing if available.
      </Alert>
    );
  }

  if (phase === REVIEW_PHASE.SESSION_EXPIRED) {
    return (
      <Alert tone="warning" title="Session expired">
        Sign in again by starting a new upload session from the top of the page.
      </Alert>
    );
  }

  if (phase === REVIEW_PHASE.EXTRACTION_UNAVAILABLE) {
    return (
      <Alert tone="warning" title="Extraction unavailable">
        {actionError ||
          "Structured extraction is not available in this environment."}
        <div className="mt-3">
          <Button type="button" variant="secondary" onClick={onRunExtract}>
            Retry extraction
          </Button>
        </div>
      </Alert>
    );
  }

  if (phase === REVIEW_PHASE.EXTRACTION_FAILED || phase === REVIEW_PHASE.NOT_FOUND) {
    return (
      <Alert tone="danger" title="Extraction not available">
        {actionError ||
          "Structured extraction could not be loaded. You can retry if text extraction succeeded."}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" onClick={onRunExtract}>Run extraction</Button>
          {carePlan ? (
            <Button type="button" variant="secondary" onClick={onReextract}>
              Re-extract
            </Button>
          ) : null}
        </div>
      </Alert>
    );
  }

  if (!carePlan) {
    return (
      <EmptyState
        title="No extraction yet"
        description="Run structured extraction to review medicines and instructions from your document."
      />
    );
  }

  const validationIssues = extractionBundle?.validationIssues || carePlan.validationIssues || [];
  const openClarifications = (carePlan.clarifications || []).filter(
    (item) => item.status === "open"
  );

  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader
          icon="ℹ"
          title="Document overview"
          description="Statuses come from the server. Reviewing here is not clinical approval."
        />
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Document processing</dt>
            <dd>
              <Badge tone="info">
                {statusSnapshot?.status || documentRecord?.status}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">AI extraction status</dt>
            <dd>
              <Badge tone="info">{extractionBundle?.aiExtractionStatus}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Care plan status</dt>
            <dd>
              <Badge
                tone={
                  carePlan.status === "review_required" ? "warning" : "info"
                }
              >
                {carePlan.status}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Caregiver review</dt>
            <dd className="font-medium text-slate-900">
              {carePlan.caregiverReviewRecorded
                ? `Recorded ${new Date(carePlan.reviewedByUserAt).toLocaleString()}`
                : "Not recorded yet"}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-slate-500">
          Clinically verified: No — {carePlan.clinicallyVerified === false
            ? "always false in this MVP"
            : ""}
        </p>
      </Card>

      {validationIssues.length ? (
        <Alert tone="warning" title="Validation notes from extraction">
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {validationIssues.map((issue, index) => (
              <li key={`${issue.code}-${index}`}>
                {issue.reason || issue.code}
                {issue.requiresProfessionalConfirmation
                  ? " (professional confirmation required)"
                  : ""}
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <Card>
        <SectionHeader icon="💊" title="Medicine instructions" />
        {carePlan.medications?.length ? (
          <div className="space-y-4">
            {carePlan.medications.map((medication) => (
              <MedicationReviewCard
                key={medication.id}
                medication={medication}
                saving={savingMedicationId === medication.id}
                onSaveCorrection={onSaveMedicationCorrection}
                onSelectPage={onSelectPage}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No medicines extracted"
            description="The document did not contain structured medicine entries."
          />
        )}
      </Card>

      <Card>
        <SectionHeader icon="✓" title="Daily care instructions" />
        <InstructionList
          items={carePlan.dailyInstructionItems}
          labelKey="instruction"
          onSelectPage={onSelectPage}
        />
      </Card>

      <Card>
        <SectionHeader icon="⚠" title="Documented warning signs" />
        <InstructionList
          items={carePlan.warningSignItems}
          labelKey="description"
          onSelectPage={onSelectPage}
        />
      </Card>

      <Card>
        <SectionHeader icon="📅" title="Follow-up appointments" />
        <InstructionList
          items={carePlan.followUpItems}
          labelKey="description"
          onSelectPage={onSelectPage}
        />
      </Card>

      <Card>
        <SectionHeader icon="?" title="Clarifications and missing information" />
        {openClarifications.length ? (
          <ul className="space-y-4">
            {openClarifications.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm"
              >
                <p className="font-semibold text-slate-900">{item.question}</p>
                <p className="mt-1 text-slate-700">{item.reason}</p>
                {item.requiresProfessionalConfirmation ? (
                  <p className="mt-2 text-xs font-medium text-amber-900">
                    Requires documented professional confirmation — not a one-click
                    resolution.
                  </p>
                ) : null}
                <SourceReferenceList
                  references={item.sourceReferences}
                  onSelectPage={onSelectPage}
                />
                <form
                  className="mt-3 space-y-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const draft = resolutionDrafts[item.id] || {};
                    onResolveClarification(item.id, {
                      status: "resolved",
                      resolutionNote: draft.note,
                      confirmationSource: draft.source || null,
                    });
                  }}
                >
                  <label className="block text-sm">
                    <span className="text-slate-600">Resolution note</span>
                    <textarea
                      required={item.requiresProfessionalConfirmation}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                      value={resolutionDrafts[item.id]?.note || ""}
                      onChange={(event) =>
                        setResolutionDrafts((prev) => ({
                          ...prev,
                          [item.id]: {
                            ...prev[item.id],
                            note: event.target.value,
                          },
                        }))
                      }
                    />
                  </label>
                  <Button type="submit" variant="secondary">
                    Record resolution
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No open clarifications" description="" />
        )}
      </Card>

      <Card>
        <SectionHeader icon="✎" title="Review actions" />
        <p className="text-sm text-slate-600">
          Selected source page for cross-check:{" "}
          <strong>{selectedPage || "—"}</strong>
        </p>
        <label className="mt-3 block text-sm">
          <span className="text-slate-600">Caregiver review note (optional)</span>
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" onClick={() => onMarkReviewed(reviewNote)}>
            Mark extraction reviewed
          </Button>
          <Button type="button" variant="secondary" onClick={onReextract}>
            Request re-extraction
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!isCarePlanReadyForContinue(carePlan)}
            onClick={onContinue}
          >
            Continue to care plan results
          </Button>
        </div>
        {!isCarePlanReadyForContinue(carePlan) ? (
          <p className="mt-2 text-xs text-slate-500">
            Resolve open clarifications before continuing. Incomplete extraction
            cannot be shown as ready.
          </p>
        ) : null}
        {actionMessage ? (
          <Alert tone="success" title="Update saved" className="mt-4">
            {actionMessage}
          </Alert>
        ) : null}
        {actionError ? (
          <Alert tone="danger" title="Action failed" className="mt-4">
            {actionError}
          </Alert>
        ) : null}
      </Card>
    </div>
  );
}
