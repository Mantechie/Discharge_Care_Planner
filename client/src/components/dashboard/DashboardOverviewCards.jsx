import { Card } from "../ui/Card.jsx";
import {
  buildTaskStats,
  countOpenClarifications,
  countUpcomingFollowUps,
} from "../../utils/dashboardStats.js";

function StatCard({ label, value, hint }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value ?? "—"}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </Card>
  );
}

export function DashboardOverviewCards({ tasks, followUps, clarifications, carePlan }) {
  const taskStats = buildTaskStats(tasks);
  const upcoming = countUpcomingFollowUps(followUps);
  const openClarifications = countOpenClarifications(clarifications, carePlan);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        label="Care tasks"
        value={taskStats.hasTaskRecords ? taskStats.total : "—"}
        hint={
          taskStats.hasTaskRecords
            ? "Persisted task records"
            : "No task records yet"
        }
      />
      <StatCard
        label="Completed"
        value={taskStats.hasTaskRecords ? taskStats.completed : "—"}
        hint={taskStats.hasTaskRecords ? undefined : "Not available"}
      />
      <StatCard
        label="Remaining"
        value={taskStats.hasTaskRecords ? taskStats.remaining : "—"}
        hint={
          taskStats.hasTaskRecords && taskStats.skipped
            ? `${taskStats.skipped} skipped`
            : taskStats.hasTaskRecords
              ? undefined
              : "Not available"
        }
      />
      <StatCard
        label="Upcoming follow-ups"
        value={upcoming ?? "—"}
        hint={
          upcoming === null
            ? "Follow-up records not loaded"
            : "Status: upcoming"
        }
      />
      <StatCard
        label="Open clarifications"
        value={openClarifications ?? "—"}
        hint="Needs attention or confirmation"
      />
    </div>
  );
}
