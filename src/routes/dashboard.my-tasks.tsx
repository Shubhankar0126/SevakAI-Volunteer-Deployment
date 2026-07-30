import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useOperationsSnapshot } from "@/hooks/use-operations";
import { INCIDENT_LABEL } from "@/lib/operations";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/my-tasks")({
  component: MyTasks,
});

function MyTasks() {
  const { role } = useAuth();
  const snapshotQuery = useOperationsSnapshot();
  const [done, setDone] = useState<Set<string>>(new Set());

  if (role && role !== "volunteer") return <Navigate to="/dashboard" />;
  if (snapshotQuery.isLoading || !snapshotQuery.data) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8 text-sm text-muted-foreground">
        Loading assignments...
      </div>
    );
  }

  const { me, myTasks, incidents } = snapshotQuery.data;
  const volunteer = me.volunteer ?? snapshotQuery.data.volunteers[0];
  const incidentById = new Map(incidents.map((incident) => [incident.id, incident]));

  if (!volunteer) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8 text-sm text-muted-foreground">
        No volunteer profile available.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="rounded-2xl border border-border bg-gradient-card p-6">
        <div className="text-xs font-medium uppercase tracking-wider text-primary">
          Volunteer workspace
        </div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">My assigned tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{me.user.email}</span> ·
          deployed as <span className="font-medium text-foreground">{volunteer.name}</span> (
          {volunteer.zone})
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Stat label="Open" value={String(myTasks.length)} />
          <Stat label="Completed" value={String(done.size)} />
          <Stat label="Hours today" value={`${volunteer.hoursToday}h`} />
        </div>
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold">Active assignments</h2>
      <ul className="mt-3 space-y-3">
        {myTasks.length === 0 && (
          <li className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No active assignments. Stand by.
          </li>
        )}
        {myTasks.map((task) => {
          const incident = incidentById.get(task.incidentId);
          const isDone = done.has(task.incidentId);
          const label = incident ? INCIDENT_LABEL[incident.type] : task.title;
          return (
            <li
              key={task.id}
              className={`rounded-xl border bg-card p-5 transition ${isDone ? "border-success/40 opacity-70" : "border-border"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        task.severity === "critical"
                          ? "bg-destructive text-destructive-foreground"
                          : task.severity === "high"
                            ? "bg-warning/80 text-foreground"
                            : "bg-gold/80 text-gold-foreground"
                      }`}
                    >
                      {task.severity}
                    </span>
                    <span className="text-sm font-semibold">{label}</span>
                    <span className="text-xs text-muted-foreground">
                      · {incident?.incidentCode ?? task.incidentId}
                    </span>
                  </div>
                  <div className="mt-2 text-sm">{incident?.note ?? task.details}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {task.zone}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> ETA {task.etaMin} min
                    </span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                      Match {task.score}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.success("Navigation started")}
                  >
                    <Navigation className="mr-1 h-3.5 w-3.5" /> Navigate
                  </Button>
                  <Button
                    size="sm"
                    disabled={isDone}
                    onClick={() => {
                      setDone((state) => new Set(state).add(task.incidentId));
                      toast.success(`${incident?.incidentCode ?? task.incidentId} marked complete`);
                    }}
                    className="bg-success text-success-foreground hover:opacity-90"
                  >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> {isDone ? "Done" : "Mark done"}
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="font-display text-2xl font-bold text-primary">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
