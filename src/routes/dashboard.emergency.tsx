import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { INCIDENTS, INCIDENT_LABEL, rankVolunteersForIncident, type Incident, type IncidentType, type IncidentSeverity } from "@/lib/sample-data";
import { Button } from "@/components/ui/button";
import { RoleGate } from "@/components/role-gate";
import { toast } from "sonner";
import { AlertTriangle, Flame, HeartPulse, PackageSearch, Shield, Users } from "lucide-react";

export const Route = createFileRoute("/dashboard/emergency")({
  component: () => <RoleGate allow={["admin", "zone_manager"]}><Emergency /></RoleGate>,
});

const TYPE_ICON: Record<IncidentType, React.ComponentType<{ className?: string }>> = {
  medical: HeartPulse, lost_child: Users, crowd_surge: AlertTriangle,
  fire: Flame, security: Shield, lost_item: PackageSearch,
};

function Emergency() {
  const [incidents, setIncidents] = useState<Incident[]>(INCIDENTS);

  const raiseSOS = () => {
    const id = `INC-${2050 + incidents.length}`;
    const next: Incident = {
      id, type: "medical", zone: "Sangam Nose", severity: "critical",
      reportedAt: new Date().toISOString(), status: "open", required: ["medical"],
      x: 50, y: 48, note: "SOS triggered from command center demo.",
    };
    setIncidents((s) => [next, ...s]);
    toast.error(`${id} created — dispatching AI matches…`);
    setTimeout(() => {
      setIncidents((s) => s.map((i) => i.id === id ? { ...i, status: "dispatched" } : i));
      const top = rankVolunteersForIncident(next)[0];
      if (top) toast.success(`${top.volunteer.name} en route — ETA ${top.etaMin}m`);
    }, 1500);
  };

  const resolve = (id: string) => {
    setIncidents((s) => s.map((i) => i.id === id ? { ...i, status: "resolved" } : i));
    toast.success(`${id} marked resolved`);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Emergency Response</h1>
          <p className="text-sm text-muted-foreground">Triage, dispatch, and close incidents in real time.</p>
        </div>
        <Button onClick={raiseSOS} className="bg-destructive text-destructive-foreground hover:opacity-90">
          <AlertTriangle className="mr-2 h-4 w-4" /> Trigger SOS (demo)
        </Button>
      </header>

      <div className="grid gap-3">
        {incidents.map((i) => {
          const Icon = TYPE_ICON[i.type];
          const top = rankVolunteersForIncident(i).slice(0, 3);
          return (
            <article key={i.id} className="rounded-2xl border border-border bg-card p-5">
              <header className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`grid h-11 w-11 place-items-center rounded-xl ${
                    i.severity === "critical" ? "bg-destructive/15 text-destructive" :
                    i.severity === "high" ? "bg-warning/20 text-warning" :
                    i.severity === "medium" ? "bg-gold/15 text-gold" : "bg-muted text-muted-foreground"
                  }`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-semibold">{INCIDENT_LABEL[i.type]}</span>
                      <SeverityBadge s={i.severity} />
                      <StatusBadge s={i.status} />
                    </div>
                    <div className="text-xs text-muted-foreground">{i.id} · {i.zone} · {i.note}</div>
                  </div>
                </div>
                {i.status !== "resolved" && (
                  <Button size="sm" variant="outline" onClick={() => resolve(i.id)}>Resolve</Button>
                )}
              </header>

              {i.status !== "resolved" && top.length > 0 && (
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {top.map((m) => (
                    <div key={m.volunteer.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold">{m.volunteer.name}</div>
                        <div className="font-display text-lg font-bold text-gold">{m.score}</div>
                      </div>
                      <div className="text-[11px] text-muted-foreground">ETA {m.etaMin}m · {m.volunteer.zone}</div>
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

function SeverityBadge({ s }: { s: IncidentSeverity }) {
  const cls = s === "critical" ? "bg-destructive text-destructive-foreground" :
    s === "high" ? "bg-warning text-foreground" :
    s === "medium" ? "bg-gold text-gold-foreground" : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold ${cls}`}>{s}</span>;
}
function StatusBadge({ s }: { s: "open" | "dispatched" | "resolved" }) {
  const cls = s === "open" ? "bg-destructive/10 text-destructive" :
    s === "dispatched" ? "bg-primary/10 text-primary" : "bg-success/10 text-success";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${cls}`}>{s}</span>;
}
