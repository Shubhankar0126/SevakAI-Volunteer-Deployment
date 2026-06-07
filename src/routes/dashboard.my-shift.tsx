import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { VOLUNTEERS } from "@/lib/sample-data";
import { Clock, Coffee, MapPin, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/dashboard/my-shift")({
  component: MyShift,
});

function MyShift() {
  const { role } = useAuth();
  if (role && role !== "volunteer") return <Navigate to="/dashboard" />;
  const me = VOLUNTEERS[0];

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="font-display text-3xl font-bold tracking-tight">My shift</h1>
      <p className="mt-1 text-sm text-muted-foreground">Today's schedule, well-being and performance.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Card icon={Clock} label="Hours" value={`${me.hoursToday}h`} tone="text-primary" />
        <Card icon={TrendingUp} label="Performance" value={String(me.performance)} tone="text-gold" />
        <Card icon={Coffee} label="Fatigue" value={`${me.fatigue}%`} tone={me.fatigue > 70 ? "text-destructive" : "text-success"} />
        <Card icon={MapPin} label="Zone" value={me.zone} tone="text-foreground" />
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Today's roster</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {[
            { t: "06:00 – 10:00", a: "Ghat 5 — morning snan support" },
            { t: "10:00 – 10:30", a: "Mandatory break", break: true },
            { t: "10:30 – 14:00", a: "Lost & Found Hub triage" },
            { t: "14:00 – 18:00", a: "Sangam Nose crowd watch" },
          ].map((s) => (
            <li key={s.t} className={`flex items-center justify-between rounded-lg border border-border px-4 py-3 ${s.break ? "bg-muted/50" : ""}`}>
              <div>
                <div className="font-medium">{s.a}</div>
                <div className="text-xs text-muted-foreground">{s.t}</div>
              </div>
              {s.break && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold">Rest</span>}
            </li>
          ))}
        </ul>
      </div>

      {me.fatigue > 60 && (
        <div className="mt-6 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
          ⚠️ AI detected high fatigue. A 20-minute rest is strongly recommended before your next assignment.
        </div>
      )}
    </div>
  );
}

function Card({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <div className={`mt-3 font-display text-2xl font-bold ${tone}`}>{value}</div>
    </div>
  );
}
