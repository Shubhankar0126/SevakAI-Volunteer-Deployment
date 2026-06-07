import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { INCIDENTS, INCIDENT_LABEL, rankVolunteersForIncident, VOLUNTEERS } from "@/lib/sample-data";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/my-tasks")({
  component: MyTasks,
});

function MyTasks() {
  const { role, user } = useAuth();
  const [done, setDone] = useState<Set<string>>(new Set());

  if (role && role !== "volunteer") return <Navigate to="/dashboard" />;

  // Simulate: pick this volunteer = first available, and show top-matched open incidents
  const me = VOLUNTEERS.find((v) => v.status === "available") ?? VOLUNTEERS[0];
  const open = INCIDENTS.filter((i) => i.status !== "resolved");
  const myTasks = open
    .map((i) => ({ inc: i, match: rankVolunteersForIncident(i).find((m) => m.volunteer.id === me.id) }))
    .filter((t) => t.match && t.match.score > 40)
    .sort((a, b) => (b.match!.score - a.match!.score));

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="rounded-2xl border border-border bg-gradient-card p-6">
        <div className="text-xs font-medium uppercase tracking-wider text-primary">Volunteer workspace</div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">My assigned tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user?.email}</span> · simulated as{" "}
          <span className="font-medium text-foreground">{me.name}</span> ({me.zone})
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Stat label="Open" value={String(myTasks.length)} />
          <Stat label="Completed" value={String(done.size)} />
          <Stat label="Hours today" value={`${me.hoursToday}h`} />
        </div>
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold">Active assignments</h2>
      <ul className="mt-3 space-y-3">
        {myTasks.length === 0 && (
          <li className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No active assignments. Stand by.
          </li>
        )}
        {myTasks.map(({ inc, match }) => {
          const isDone = done.has(inc.id);
          return (
            <li key={inc.id} className={`rounded-xl border bg-card p-5 transition ${isDone ? "border-success/40 opacity-70" : "border-border"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      inc.severity === "critical" ? "bg-destructive text-destructive-foreground" :
                      inc.severity === "high" ? "bg-warning/80 text-foreground" : "bg-gold/80 text-gold-foreground"
                    }`}>{inc.severity}</span>
                    <span className="text-sm font-semibold">{INCIDENT_LABEL[inc.type]}</span>
                    <span className="text-xs text-muted-foreground">· {inc.id}</span>
                  </div>
                  <div className="mt-2 text-sm">{inc.note}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {inc.zone}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> ETA {match!.etaMin} min</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">Match {match!.score}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline" onClick={() => toast.success("Navigation started")}>
                    <Navigation className="mr-1 h-3.5 w-3.5" /> Navigate
                  </Button>
                  <Button
                    size="sm"
                    disabled={isDone}
                    onClick={() => {
                      setDone((s) => new Set(s).add(inc.id));
                      toast.success(`${inc.id} marked complete`);
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
