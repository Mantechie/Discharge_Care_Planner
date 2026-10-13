import { Card, SectionHeader } from "../ui/Card.jsx";
import { Alert } from "../ui/Alert.jsx";
import { Button } from "../ui/Button.jsx";
import { Badge } from "../ui/Badge.jsx";
import { EmptyState } from "../ui/EmptyState.jsx";
import { LoadingSkeleton } from "../ui/LoadingSkeleton.jsx";
import { SourceReferenceList } from "../review/SourceReferenceList.jsx";
import { DashboardOverviewCards } from "./DashboardOverviewCards.jsx";
import {
  DASHBOARD_LOAD_STATE,
  useCarePlanDashboard,
} from "../../hooks/useCarePlanDashboard.js";
import {
  formatDocumentedValue,
  formatFoodInstruction,
  formatReviewStatus,
} from "../../utils/extractionLabels.js";
import { isCarePlanClinicallyReady } from "../../utils/dashboardStats.js";
import { TaskChecklistSection } from "./TaskChecklistSection.jsx";
import { FollowUpsSection } from "./FollowUpsSection.jsx";
import { ClarificationsSection } from "./ClarificationsSection.jsx";
import { useTranslation } from "../../i18n/LanguageProvider.jsx";

function MedicineCard({ medication }) {
  const { t } = useTranslation();
  const extracted = medication.extracted;
  const display = medication.display;

  return (
    <article className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-semibold text-slate-900">
          {formatDocumentedValue(extracted.name)}
        </h4>
        <Badge tone="info">{formatReviewStatus(extracted.reviewStatus, t)}</Badge>
      </div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Dose / strength</dt>
          <dd>{formatDocumentedValue(display.dose ?? extracted.dose)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Route</dt>
          <dd>{formatDocumentedValue(extracted.route)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Frequency</dt>
          <dd>{formatDocumentedValue(display.frequency ?? extracted.frequency)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Exact time</dt>
          <dd>{formatDocumentedValue(display.timing ?? extracted.timing)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Duration</dt>
          <dd>{formatDocumentedValue(extracted.duration)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Food instruction</dt>
          <dd>{formatFoodInstruction(extracted.foodInstruction, t)}</dd>
        </div>
      </dl>
      {medication.hasCaregiverEdits ? (
        <p className="mt-2 text-xs text-amber-800">
          Includes caregiver correction — see review section for original extraction.
        </p>
      ) : null}
      <div className="mt-3">
        <SourceReferenceList references={extracted.sourceReferences} />
      </div>
    </article>
  );
}

export function CarePlanResultsDashboard({
  documentId,
  documentRecord,
  statusSnapshot,
  onUploadAnother,
  onJumpToReview,
}) {
  const { t } = useTranslation();
  const dashboard = useCarePlanDashboard(documentId);
  const carePlan = dashboard.carePlan;

  if (dashboard.loadState === DASHBOARD_LOAD_STATE.LOADING) {
    return (
      <section className="mt-8" aria-busy="true">
        <h2 className="text-xl font-bold">Daily care plan</h2>
        <div className="mt-4">
          <LoadingSkeleton lines={8} />
        </div>
      </section>
    );
  }

  if (dashboard.loadState === DASHBOARD_LOAD_STATE.SESSION_EXPIRED) {
    return (
      <Alert tone="warning" title={t("dashboard.sessionExpired")} className="mt-8" role="alert">
        {dashboard.errorMessage}
      </Alert>
    );
  }

  if (dashboard.loadState === DASHBOARD_LOAD_STATE.NO_CARE_PLAN) {
    return (
      <section className="mt-8">
        <EmptyState
          title="No care plan available"
          description="Complete structured extraction in the review section below to build your daily plan."
        />
      </section>
    );
  }

  if (dashboard.loadState === DASHBOARD_LOAD_STATE.ERROR) {
    return (
      <Alert tone="danger" title={t("dashboard.loadError")} className="mt-8" role="alert">
        {dashboard.errorMessage}
        <Button type="button" variant="secondary" className="mt-3" onClick={dashboard.refresh}>
          Retry
        </Button>
      </Alert>
    );
  }

  if (!carePlan) {
    return null;
  }

  const clinicallyReady = isCarePlanClinicallyReady(carePlan);
  return (
    <section className="mt-8 space-y-6" aria-labelledby="daily-care-plan-heading">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            DischargeCare · Daily plan
          </p>
          <h2 id="daily-care-plan-heading" className="text-2xl font-bold">
            Care plan results
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Document: {documentRecord?.originalFilename || "Selected summary"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone={clinicallyReady ? "success" : "warning"}>
              Care plan: {carePlan.status}
            </Badge>
            <Badge tone="info">
              Processing: {statusSnapshot?.status || documentRecord?.status}
            </Badge>
            {dashboard.aiExtractionStatus ? (
              <Badge tone="info">AI: {dashboard.aiExtractionStatus}</Badge>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Not clinically approved. Reviewing this screen does not replace advice
            from your healthcare team.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={onUploadAnother}>
            Upload another document
          </Button>
          <Button type="button" variant="ghost" onClick={dashboard.refresh}>
            Refresh
          </Button>
        </div>
      </div>

      {!clinicallyReady ? (
        <Alert tone="warning" title="Review required before relying on this plan">
          This care plan is not marked ready. Resolve clarifications and complete
          review below before treating instructions as final.
          {onJumpToReview ? (
            <button
              type="button"
              className="mt-2 block text-sm font-semibold text-teal-800 underline"
              onClick={onJumpToReview}
            >
              Go to document review
            </button>
          ) : null}
        </Alert>
      ) : null}

      <div aria-live="polite" className="sr-only">
        {dashboard.statusMessage}
      </div>

      {dashboard.statusMessage ? (
        <Alert tone="success" title="Saved">
          {dashboard.statusMessage}
        </Alert>
      ) : null}

      <DashboardOverviewCards
        tasks={dashboard.tasks}
        followUps={dashboard.followUps}
        clarifications={dashboard.clarifications}
        carePlan={carePlan}
      />

      <Card>
        <SectionHeader icon="💊" title="Medicine instructions" />
        {carePlan.medications?.length ? (
          <div className="space-y-4">
            {carePlan.medications.map((medication) => (
              <MedicineCard key={medication.id} medication={medication} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No medicines listed"
            description="Nothing was extracted for medicines from your document."
          />
        )}
      </Card>

      <TaskChecklistSection
        tasks={dashboard.tasks}
        dailyInstructionItems={carePlan.dailyInstructionItems}
        updatingTaskId={dashboard.updatingTaskId}
        creatingTaskKey={dashboard.creatingTaskKey}
        onToggleComplete={dashboard.toggleTaskComplete}
        onToggleSkip={dashboard.toggleTaskSkipped}
        onTrackInstruction={dashboard.trackInstructionAsTask}
      />

      <Card>
        <SectionHeader
          icon="⚠"
          title="Documented warning signs"
          description="From your discharge summary only — not generic emergency advice."
        />
        {carePlan.warningSignItems?.length ? (
          <ul className="space-y-2">
            {carePlan.warningSignItems.map((item, index) => (
              <li
                key={item.id || index}
                className="rounded-lg border border-amber-100 bg-amber-50/40 p-3 text-sm"
              >
                <p className="font-medium text-slate-900">
                  {formatDocumentedValue(item.description)}
                </p>
                <SourceReferenceList references={item.sourceReferences} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No warning signs extracted"
            description="If your summary lists warning signs, they may need review or re-extraction."
          />
        )}
        <p className="mt-3 text-xs text-slate-500">
          For emergencies, contact local emergency services — this app does not
          provide personalized emergency triage.
        </p>
      </Card>

      <FollowUpsSection
        followUps={dashboard.followUps}
        followUpItems={carePlan.followUpItems}
        savingFollowUpId={dashboard.savingFollowUpId}
        creatingFollowUp={dashboard.creatingFollowUp}
        onMarkStatus={dashboard.markFollowUpStatus}
        onAddCaregiverFollowUp={dashboard.addCaregiverFollowUp}
      />

      <ClarificationsSection
        clarifications={dashboard.clarifications}
        resolvingClarificationId={dashboard.resolvingClarificationId}
        onResolve={dashboard.submitClarificationResolution}
      />

      {dashboard.errorMessage ? (
        <Alert tone="danger" title="Update failed">{dashboard.errorMessage}</Alert>
      ) : null}
    </section>
  );
}
