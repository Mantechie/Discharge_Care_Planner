import { Card, SectionHeader } from "../ui/Card.jsx";
import { Button } from "../ui/Button.jsx";
import { EmptyState } from "../ui/EmptyState.jsx";
import { SourceReferenceList } from "../review/SourceReferenceList.jsx";
import { formatDocumentedValue } from "../../utils/extractionLabels.js";
import { buildTaskProgress } from "../../utils/taskProgress.js";
import { useTranslation } from "../../i18n/LanguageProvider.jsx";

function statusLabel(status, t) {
  const key = `tasks.status.${status}`;
  const translated = t(key);
  if (translated && !translated.startsWith("[")) {
    return translated;
  }
  return status;
}

export function TaskChecklistSection({
  tasks,
  dailyInstructionItems,
  updatingTaskId,
  creatingTaskKey,
  onToggleComplete,
  onToggleSkip,
  onTrackInstruction,
}) {
  const { t } = useTranslation();
  const progress = buildTaskProgress(tasks);
  const skippedPart = progress.skipped
    ? t("tasks.skippedPart", { skipped: progress.skipped })
    : "";

  return (
    <Card>
      <SectionHeader
        icon="✓"
        title={t("tasks.title")}
        description={t("tasks.description")}
      />

      {progress.hasTaskRecords ? (
        <p className="mb-4 text-sm text-slate-600" aria-live="polite">
          {t("tasks.progress", {
            completed: progress.completed,
            remaining: progress.remaining,
            skippedPart,
            total: progress.total,
          })}
        </p>
      ) : null}

      {tasks.length ? (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-start"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-700 focus-visible:ring-2 focus-visible:ring-teal-600"
                  checked={task.status === "completed"}
                  disabled={updatingTaskId === task.id}
                  aria-label={`Mark ${task.title} complete`}
                  onChange={() => onToggleComplete(task)}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{task.title}</p>
                  {task.description ? (
                    <p className="text-sm text-slate-600">{task.description}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-500">
                    <span className="font-medium">Status:</span>{" "}
                    {statusLabel(task.status, t)}
                    {task.scheduledTime
                      ? ` · Time: ${task.scheduledTime}`
                      : " · Time: Not specified in the document"}
                  </p>
                  {updatingTaskId === task.id ? (
                    <p className="mt-1 text-xs text-teal-800">Saving…</p>
                  ) : null}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="md"
                disabled={updatingTaskId === task.id}
                onClick={() => onToggleSkip(task)}
              >
                {task.status === "skipped" ? "Unskip" : "Skip for today"}
              </Button>
            </li>
          ))}
        </ul>
      ) : dailyInstructionItems?.length ? (
        <ul className="space-y-2">
          {dailyInstructionItems.map((item, index) => {
            const key = item.id || `instruction-${index}`;
            return (
              <li
                key={key}
                className="rounded-lg border border-dashed border-slate-300 p-3 text-sm"
              >
                <p className="font-medium">
                  {formatDocumentedValue(item.instruction)}
                </p>
                <SourceReferenceList references={item.sourceReferences} />
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-3"
                  disabled={creatingTaskKey === key}
                  onClick={() => onTrackInstruction(item, index)}
                >
                  {creatingTaskKey === key ? "…" : t("tasks.trackInstruction")}
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState title={t("tasks.empty")} description="" />
      )}
    </Card>
  );
}
