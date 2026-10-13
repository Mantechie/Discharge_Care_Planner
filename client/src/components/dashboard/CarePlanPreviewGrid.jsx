import { Card, SectionHeader } from "../ui/Card.jsx";

const PLACEHOLDER_SECTIONS = [
  {
    icon: "💊",
    title: "Medicine instructions",
    text: "Documented doses and schedules will appear here after extraction.",
  },
  {
    icon: "✓",
    title: "Daily care tasks",
    text: "Caregiver tasks linked to your plan will list here.",
  },
  {
    icon: "⚠",
    title: "Warning signs",
    text: "Only warning signs found in your summary will be shown.",
  },
  {
    icon: "📅",
    title: "Follow-up appointments",
    text: "Appointments extracted from your document will display here.",
  },
];

export function CarePlanPreviewGrid() {
  return (
    <section aria-labelledby="preview-sections-heading" className="mt-10">
      <h2 id="preview-sections-heading" className="text-lg font-bold text-slate-900">
        After processing, your dashboard will include
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Placeholder layout only — no patient data is shown in this phase.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {PLACEHOLDER_SECTIONS.map((section) => (
          <Card key={section.title}>
            <SectionHeader
              icon={section.icon}
              title={section.title}
              description={section.text}
            />
          </Card>
        ))}
      </div>
    </section>
  );
}
