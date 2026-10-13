import { useState } from "react";
import { Card, SectionHeader } from "../ui/Card.jsx";
import { Button } from "../ui/Button.jsx";
import { Badge } from "../ui/Badge.jsx";
import { EmptyState } from "../ui/EmptyState.jsx";
import { SourceReferenceList } from "../review/SourceReferenceList.jsx";
import { formatDocumentedValue } from "../../utils/extractionLabels.js";
import { validateFollowUpDraft } from "../../utils/followUpValidation.js";
import { useTranslation } from "../../i18n/LanguageProvider.jsx";

function formatAppointmentDate(value) {
  if (!value) {
    return "Date not specified in the document";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date not specified in the document";
  }
  return date.toLocaleDateString();
}

export function FollowUpsSection({
  followUps,
  followUpItems,
  savingFollowUpId,
  creatingFollowUp,
  onMarkStatus,
  onAddCaregiverFollowUp,
}) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    appointmentDate: "",
    appointmentTime: "",
    location: "",
    instructions: "",
  });
  const [formErrors, setFormErrors] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();
    const validation = validateFollowUpDraft(draft);
    setFormErrors(validation.errors);
    if (!validation.valid) {
      return;
    }

    const result = await onAddCaregiverFollowUp(draft);
    if (result?.ok) {
      setDraft({
        title: "",
        appointmentDate: "",
        appointmentTime: "",
        location: "",
        instructions: "",
      });
      setShowForm(false);
    }
  }

  return (
    <Card>
      <SectionHeader
        icon="📅"
        title={t("followups.title")}
        description={t("followups.description")}
      />

      {followUps.length ? (
        <ul className="space-y-3">
          {followUps.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-slate-200 p-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{item.title}</p>
                <Badge tone="info">{item.status}</Badge>
              </div>
              {item.origin === "caregiver_entered" ? (
                <p className="mt-1 text-xs font-medium text-slate-600">
                  Caregiver-entered (not from extraction)
                </p>
              ) : item.sourceExtracted ? (
                <p className="mt-1 text-xs text-slate-500">From discharge summary</p>
              ) : null}
              <p className="mt-2 text-slate-600">
                Date: {formatAppointmentDate(item.appointmentDate)}
              </p>
              <p className="text-slate-600">
                Time: {formatDocumentedValue(item.appointmentTime)}
              </p>
              <p className="text-slate-600">
                Location / department: {formatDocumentedValue(item.location)}
              </p>
              {item.instructions ? (
                <p className="mt-1 text-slate-600">{item.instructions}</p>
              ) : null}
              <SourceReferenceList references={item.sourceReferences} />
              <div className="mt-3 flex flex-wrap gap-2">
                {item.status === "upcoming" ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={savingFollowUpId === item.id}
                    onClick={() => onMarkStatus(item, "completed")}
                  >
                    Mark attended
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : followUpItems?.length ? (
        <ul className="space-y-2">
          {followUpItems.map((item, index) => (
            <li key={item.id || index} className="rounded-lg border p-3 text-sm">
              <p className="font-medium">
                {formatDocumentedValue(item.description)}
              </p>
              <p className="text-slate-600">
                Date: {formatDocumentedValue(item.date)}
              </p>
              <p className="text-slate-600">
                Time: {formatDocumentedValue(item.time)}
              </p>
              <p className="text-slate-600">
                Location: {formatDocumentedValue(item.location)}
              </p>
              <SourceReferenceList references={item.sourceReferences} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={t("followups.empty")} description="" />
      )}

      <div className="mt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowForm((open) => !open)}
        >
          {showForm ? "Cancel" : "Add caregiver follow-up"}
        </Button>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-xl border border-dashed border-slate-300 p-4">
          <p className="text-xs text-slate-600">
            Only enter details you were given. Leave date/time blank if unknown.
          </p>
          <label className="block text-sm">
            Description
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
            {formErrors.title ? (
              <span className="text-xs text-red-700">{formErrors.title}</span>
            ) : null}
          </label>
          <label className="block text-sm">
            Date (optional, YYYY-MM-DD)
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={draft.appointmentDate}
              onChange={(e) =>
                setDraft((d) => ({ ...d, appointmentDate: e.target.value }))
              }
            />
            {formErrors.appointmentDate ? (
              <span className="text-xs text-red-700">
                {formErrors.appointmentDate}
              </span>
            ) : null}
          </label>
          <label className="block text-sm">
            Time (optional, HH:MM)
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="14:30"
              value={draft.appointmentTime}
              onChange={(e) =>
                setDraft((d) => ({ ...d, appointmentTime: e.target.value }))
              }
            />
            {formErrors.appointmentTime ? (
              <span className="text-xs text-red-700">
                {formErrors.appointmentTime}
              </span>
            ) : null}
          </label>
          <label className="block text-sm">
            Location / clinician (optional)
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={draft.location}
              onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
            />
          </label>
          <Button type="submit" disabled={creatingFollowUp}>
            {creatingFollowUp ? "Saving…" : "Save follow-up"}
          </Button>
        </form>
      ) : null}
    </Card>
  );
}
