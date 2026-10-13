import { useState } from "react";
import { Card, SectionHeader } from "../ui/Card.jsx";
import { Button } from "../ui/Button.jsx";
import { EmptyState } from "../ui/EmptyState.jsx";
import { SourceReferenceList } from "../review/SourceReferenceList.jsx";
import { validateClarificationResolution } from "../../utils/followUpValidation.js";
import { useTranslation } from "../../i18n/LanguageProvider.jsx";

export function ClarificationsSection({
  clarifications,
  resolvingClarificationId,
  onResolve,
}) {
  const { t } = useTranslation();
  const openItems = (clarifications || []).filter((item) => item.status === "open");
  const [drafts, setDrafts] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleResolve(clarification, status) {
    const draft = drafts[clarification.id] || {};
    const validation = validateClarificationResolution({
      requiresProfessionalConfirmation:
        clarification.requiresProfessionalConfirmation,
      resolutionNote: draft.note,
    });

    if (!validation.valid) {
      setFieldErrors((prev) => ({
        ...prev,
        [clarification.id]: validation.message,
      }));
      return;
    }

    setFieldErrors((prev) => ({ ...prev, [clarification.id]: null }));

    const result = await onResolve(clarification.id, {
      status,
      resolutionNote: draft.note?.trim(),
      confirmationSource: draft.source?.trim() || null,
      confirmedWithProfessionalOn: draft.confirmedOn || null,
    });

    if (result?.ok) {
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[clarification.id];
        return next;
      });
    }
  }

  return (
    <Card>
      <SectionHeader
        icon="?"
        title={t("clarifications.title")}
        description={t("clarifications.description")}
      />

      {openItems.length ? (
        <ul className="space-y-4">
          {openItems.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm"
            >
              <p className="font-semibold text-slate-900">{item.question}</p>
              <p className="mt-1 text-slate-700">{item.reason}</p>
              <p className="mt-2 text-xs font-medium text-amber-900">
                Status: {item.status}
                {item.requiresProfessionalConfirmation
                  ? " · Professional confirmation required"
                  : ""}
              </p>
              <SourceReferenceList references={item.sourceReferences} />

              <div className="mt-3 space-y-2">
                <label className="block text-sm">
                  Resolution note
                  <textarea
                    required
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    value={drafts[item.id]?.note || ""}
                    onChange={(event) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [item.id]: { ...prev[item.id], note: event.target.value },
                      }))
                    }
                  />
                </label>
                {item.requiresProfessionalConfirmation ? (
                  <>
                    <label className="block text-sm">
                      Confirmation source (e.g. clinic name, call reference)
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                        value={drafts[item.id]?.source || ""}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...prev[item.id],
                              source: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className="block text-sm">
                      Confirmed on (optional)
                      <input
                        type="date"
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                        value={drafts[item.id]?.confirmedOn || ""}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...prev[item.id],
                              confirmedOn: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                  </>
                ) : null}
                {fieldErrors[item.id] ? (
                  <p className="text-xs text-red-700" role="alert">
                    {fieldErrors[item.id]}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={resolvingClarificationId === item.id}
                    onClick={() => handleResolve(item, "resolved")}
                  >
                    {resolvingClarificationId === item.id
                      ? "Saving…"
                      : "Record resolution"}
                  </Button>
                  {!item.requiresProfessionalConfirmation ? (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={resolvingClarificationId === item.id}
                      onClick={() => handleResolve(item, "dismissed")}
                    >
                      Dismiss with note
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No open clarifications"
          description="Resolved items are removed from this list after the server confirms the update."
        />
      )}

      {(clarifications || []).some((item) => item.status !== "open") ? (
        <p className="mt-4 text-xs text-slate-500">
          {(clarifications || []).filter((item) => item.status !== "open").length}{" "}
          clarification(s) already resolved or dismissed.
        </p>
      ) : null}
    </Card>
  );
}
