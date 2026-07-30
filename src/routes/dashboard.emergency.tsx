import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  INCIDENT_LABEL,
  rankVolunteersForIncident,
  type IncidentSeverity,
  type IncidentStatus,
  type IncidentType,
} from "@/lib/operations";
import { assignmentApi, incidentApi } from "@/lib/api/services/sevakai";
import { getApiErrorMessage } from "@/lib/api/client";
import { useOperationsSnapshot, OPERATIONS_QUERY_KEY } from "@/hooks/use-operations";
import { Button } from "@/components/ui/button";
import { RoleGate } from "@/components/role-gate";
import { toast } from "sonner";
import { AlertTriangle, Flame, HeartPulse, PackageSearch, Shield, Users } from "lucide-react";

export const Route = createFileRoute("/dashboard/emergency")({
  component: () => (
    <RoleGate allow={["admin", "zone_manager"]}>
      <Emergency />
    </RoleGate>
  ),
});

const TYPE_ICON: Record<IncidentType, React.ComponentType<{ className?: string }>> = {
  medical: HeartPulse,
  lost_child: Users,
  crowd_surge: AlertTriangle,
  fire: Flame,
  security: Shield,
  lost_item: PackageSearch,
};

function Emergency() {
  const snapshotQuery = useOperationsSnapshot();
  const queryClient = useQueryClient();

  const raiseSosMutation = useMutation({
    mutationFn: async () => {
      const zone = snapshotQuery.data?.zones[0];
      if (!zone) {
        throw new Error("No zone data available.");
      }

      const incident = await incidentApi.create({
        type: "medical",
        zoneId: zone.id,
        severity: "critical",
        note: "SOS triggered from command center.",
        required: ["medical"],
        x: zone.x,
        y: zone.y,
      });

      const matches = await assignmentApi.dispatch(incident.id, 1);
      return { incident, matches };
    },
    onSuccess: async ({ incident, matches }) => {
      toast.error(`${incident.incidentCode} created - dispatching AI matches...`);
      if (matches[0]) {
        toast.success(`${matches[0].volunteer.name} en route - ETA ${matches[0].etaMin}m`);
      }
      await queryClient.invalidateQueries({ queryKey: OPERATIONS_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (incidentId: string) => incidentApi.resolve(incidentId),
    onSuccess: async (incident) => {
      toast.success(`${incident.incidentCode} marked resolved`);
      await queryClient.invalidateQueries({ queryKey: OPERATIONS_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  if (snapshotQuery.isLoading || !snapshotQuery.data) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-muted-foreground">
        Loading emergency response...
      </div>
    );
  }

  const incidents = snapshotQuery.data.incidents;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Emergency Response</h1>
          <p className="text-sm text-muted-foreground">
            Triage, dispatch, and close incidents in real time.
          </p>
        </div>
        <Button
          onClick={() => raiseSosMutation.mutate()}
          disabled={raiseSosMutation.isPending}
          className="bg-destructive text-destructive-foreground hover:opacity-90"
        >
          <AlertTriangle className="mr-2 h-4 w-4" /> Trigger SOS
        </Button>
      </header>

      <div className="grid gap-3">
        {incidents.map((incident) => {
          const Icon = TYPE_ICON[incident.type];
          const top = rankVolunteersForIncident(incident, snapshotQuery.data!.volunteers).slice(
            0,
            3,
          );
          return (
            <article key={incident.id} className="rounded-2xl border border-border bg-card p-5">
              <header className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-xl ${
                      incident.severity === "critical"
                        ? "bg-destructive/15 text-destructive"
                        : incident.severity === "high"
                          ? "bg-warning/20 text-warning"
                          : incident.severity === "medium"
                            ? "bg-gold/15 text-gold"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-semibold">
                        {INCIDENT_LABEL[incident.type]}
                      </span>
                      <SeverityBadge severity={incident.severity} />
                      <StatusBadge status={incident.status} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {incident.incidentCode} · {incident.zone} · {incident.note}
                    </div>
                  </div>
                </div>
                {incident.status !== "resolved" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveMutation.mutate(incident.id)}
                  >
                    Resolve
                  </Button>
                )}
              </header>

              {incident.status !== "resolved" && top.length > 0 && (
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {top.map((match) => (
                    <div key={match.volunteer.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold">{match.volunteer.name}</div>
                        <div className="font-display text-lg font-bold text-gold">
                          {match.score}
                        </div>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        ETA {match.etaMin}m · {match.volunteer.zone}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  const classes =
    severity === "critical"
      ? "bg-destructive text-destructive-foreground"
      : severity === "high"
        ? "bg-warning text-foreground"
        : severity === "medium"
          ? "bg-gold text-gold-foreground"
          : "bg-muted text-muted-foreground";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold ${classes}`}
    >
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: IncidentStatus }) {
  const classes =
    status === "open"
      ? "bg-destructive/10 text-destructive"
      : status === "dispatched"
        ? "bg-primary/10 text-primary"
        : "bg-success/10 text-success";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${classes}`}>
      {status}
    </span>
  );
}
