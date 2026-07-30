import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Brain, Zap } from "lucide-react";
import { toast } from "sonner";
import { RoleGate } from "@/components/role-gate";
import { Button } from "@/components/ui/button";
import { OPERATIONS_QUERY_KEY, useOperationsSnapshot } from "@/hooks/use-operations";
import { getApiErrorMessage } from "@/lib/api/client";
import { assignmentApi } from "@/lib/api/services/sevakai";
import { INCIDENT_LABEL, rankVolunteersForIncident } from "@/lib/operations";

export const Route = createFileRoute("/dashboard/assign")({
  component: () => (
    <RoleGate allow={["admin", "zone_manager"]}>
      <SmartAssign />
    </RoleGate>
  ),
});

function SmartAssign() {
  const snapshotQuery = useOperationsSnapshot();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const dispatchMutation = useMutation({
    mutationFn: (incidentId: string) => assignmentApi.dispatch(incidentId, 3),
    onSuccess: async (matches) => {
      toast.success(`Top ${matches.length} responders dispatched.`);
      await queryClient.invalidateQueries({ queryKey: OPERATIONS_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  if (snapshotQuery.isLoading || !snapshotQuery.data) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-muted-foreground">
        Loading assignment engine...
      </div>
    );
  }

  const openIncidents = snapshotQuery.data.incidents.filter(
    (incident) => incident.status !== "resolved",
  );
  const incident = openIncidents.find((item) => item.id === selectedId) ?? openIncidents[0];
  const matches = incident
    ? rankVolunteersForIncident(incident, snapshotQuery.data.volunteers).slice(0, 8)
    : [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Smart Assignment Engine</h1>
        <p className="text-sm text-muted-foreground">
          Volunteers scored by skill fit (45%), distance (25%), workload (15%), performance (15%).
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-2">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Open incidents</h2>
          {openIncidents.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`w-full rounded-xl border p-3 text-left transition ${
                incident?.id === item.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{INCIDENT_LABEL[item.type]}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                    item.severity === "critical"
                      ? "bg-destructive/15 text-destructive"
                      : item.severity === "high"
                        ? "bg-warning/20 text-warning"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.severity}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {item.incidentCode} · {item.zone}
              </div>
            </button>
          ))}
        </aside>

        <section className="rounded-2xl border border-border bg-card p-6">
          {incident ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      AI Recommendations
                    </span>
                  </div>
                  <h2 className="mt-1 font-display text-2xl font-semibold">
                    {INCIDENT_LABEL[incident.type]} · {incident.zone}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Requires: {incident.required.join(", ")} · {incident.note}
                  </p>
                </div>
                <Button
                  className="bg-primary text-primary-foreground"
                  disabled={dispatchMutation.isPending}
                  onClick={() => dispatchMutation.mutate(incident.id)}
                >
                  <Zap className="mr-2 h-4 w-4" /> Auto-dispatch top 3
                </Button>
              </div>

              <ul className="mt-4 divide-y divide-border">
                {matches.map((match, index) => (
                  <li key={match.volunteer.id} className="flex flex-wrap items-center gap-4 py-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="min-w-[180px]">
                      <div className="text-sm font-semibold">{match.volunteer.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {match.volunteer.volunteerCode} · {match.volunteer.zone}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {match.volunteer.skills.map((skill) => (
                        <span
                          key={skill}
                          className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                            incident.required.includes(skill)
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
                      <Bar label="Skill" v={match.breakdown.skill} />
                      <Bar label="Dist" v={match.breakdown.distance} />
                      <Bar label="Load" v={match.breakdown.workload} />
                      <div className="text-right">
                        <div className="font-display text-2xl font-bold text-gold">
                          {match.score}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider">
                          ETA {match.etaMin}m
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toast.success(`${match.volunteer.name} ready for dispatch`)}
                      >
                        Dispatch
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No open incidents.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function Bar({ label, v }: { label: string; v: number }) {
  return (
    <div className="w-16">
      <div className="flex justify-between text-[10px] uppercase tracking-wider">
        <span>{label}</span>
        <span>{v}</span>
      </div>
      <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
