import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { useOperationsSnapshot } from "@/hooks/use-operations";
import { INCIDENT_LABEL, rankVolunteersForIncident } from "@/lib/operations";
import {
  Activity,
  AlertTriangle,
  Brain,
  CalendarClock,
  ClipboardList,
  HeartPulse,
  Map as MapIcon,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ROLE_LABEL } from "@/lib/role-access";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

function Overview() {
  const { role } = useAuth();
  const snapshotQuery = useOperationsSnapshot();

  if (snapshotQuery.isLoading || !snapshotQuery.data) {
    return <LoadingState />;
  }

  const snapshot = snapshotQuery.data;
  if (role === "volunteer") return <VolunteerOverview role={role} snapshot={snapshot} />;
  if (role === "zone_manager") return <ManagerOverview role={role} snapshot={snapshot} />;
  return <AdminOverview role={role} snapshot={snapshot} />;
}

function AdminOverview({
  role,
  snapshot,
}: {
  role: AppRole | null;
  snapshot: NonNullable<ReturnType<typeof useOperationsSnapshot>["data"]>;
}) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <Header
        role={role}
        title="Live operations"
        sub={`Full org view · ${snapshot.zones.length} zones, ${snapshot.volunteers.length}+ volunteers, ${snapshot.stats.openIncidents} open incidents.`}
      />

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <KPI
          icon={Users}
          label="Active volunteers"
          value={snapshot.stats.activeVolunteers.toLocaleString()}
          tone="text-success"
        />
        <KPI
          icon={Activity}
          label="Available now"
          value={snapshot.stats.availableVolunteers.toLocaleString()}
          tone="text-primary"
        />
        <KPI
          icon={AlertTriangle}
          label="Open incidents"
          value={String(snapshot.stats.openIncidents)}
          tone="text-warning"
        />
        <KPI
          icon={ShieldCheck}
          label="Avg. performance"
          value={String(snapshot.stats.averagePerformance)}
          tone="text-gold"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <OpenIncidentsCard incidents={snapshot.incidents} />
        <ShortageCard forecasts={snapshot.forecasts} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <QuickLink
          to="/dashboard/map"
          icon={MapIcon}
          title="Command Map"
          copy="Volunteers, incidents, density heatmap."
        />
        <QuickLink
          to="/dashboard/analytics"
          icon={Activity}
          title="Analytics"
          copy="Fatigue, response times, staffing."
        />
        <QuickLink
          to="/dashboard/assistant"
          icon={Brain}
          title="AI Ops Assistant"
          copy="Ask anything about live operations."
        />
      </div>
    </div>
  );
}

function ManagerOverview({
  role,
  snapshot,
}: {
  role: AppRole | null;
  snapshot: NonNullable<ReturnType<typeof useOperationsSnapshot>["data"]>;
}) {
  const managerZoneId =
    snapshot.me.zoneManager?.zoneId ?? snapshot.me.profile?.zoneId ?? snapshot.zones[0]?.id;
  const myZone = snapshot.zones.find((zone) => zone.id === managerZoneId) ?? snapshot.zones[0];
  const zoneVolunteers = snapshot.volunteers.filter((volunteer) => volunteer.zoneId === myZone?.id);
  const zoneIncidents = snapshot.incidents.filter(
    (incident) => incident.zoneId === myZone?.id && incident.status !== "resolved",
  );
  const available = zoneVolunteers.filter((volunteer) => volunteer.status === "available").length;

  if (!myZone) {
    return <LoadingState />;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <Header
        role={role}
        title={`Zone: ${myZone.name}`}
        sub={`Density ${myZone.density}% · ${myZone.active}/${myZone.capacity} pilgrims active`}
      />

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <KPI
          icon={Users}
          label="My volunteers"
          value={String(zoneVolunteers.length)}
          tone="text-primary"
        />
        <KPI icon={Activity} label="Available" value={String(available)} tone="text-success" />
        <KPI
          icon={AlertTriangle}
          label="Open in zone"
          value={String(zoneIncidents.length)}
          tone="text-warning"
        />
        <KPI
          icon={ShieldCheck}
          label="Capacity"
          value={`${Math.round((myZone.active / myZone.capacity) * 100)}%`}
          tone="text-gold"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Open incidents in {myZone.name}</h2>
          <ul className="mt-4 divide-y divide-border">
            {zoneIncidents.length === 0 && (
              <li className="py-3 text-sm text-muted-foreground">All clear in your zone.</li>
            )}
            {zoneIncidents.map((incident) => (
              <li key={incident.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-lg ${severityBg(incident.severity)}`}
                  >
                    <HeartPulse className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold">{INCIDENT_LABEL[incident.type]}</div>
                    <div className="text-xs text-muted-foreground">
                      {incident.incidentCode} · {incident.note}
                    </div>
                  </div>
                </div>
                <Link
                  to="/dashboard/assign"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Dispatch {"->"}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">My roster</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {zoneVolunteers.slice(0, 6).map((volunteer) => (
              <li
                key={volunteer.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <div>
                  <div className="font-medium">{volunteer.name}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {volunteer.skills.join(" · ")}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${
                    volunteer.status === "available"
                      ? "bg-success/15 text-success"
                      : volunteer.status === "busy"
                        ? "bg-warning/20 text-warning"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {volunteer.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function VolunteerOverview({
  role,
  snapshot,
}: {
  role: AppRole | null;
  snapshot: NonNullable<ReturnType<typeof useOperationsSnapshot>["data"]>;
}) {
  const me =
    snapshot.me.volunteer ??
    snapshot.volunteers.find((volunteer) => volunteer.userId === snapshot.me.user.id) ??
    snapshot.volunteers[0];
  const openIncidents = snapshot.incidents.filter((incident) => incident.status !== "resolved");
  const topMatch = me
    ? openIncidents
        .map((incident) => ({
          incident,
          match: rankVolunteersForIncident(incident, snapshot.volunteers).find(
            (item) => item.volunteer.id === me.id,
          ),
        }))
        .filter((item) => item.match)
        .sort((left, right) => right.match!.score - left.match!.score)[0]
    : undefined;

  if (!me) {
    return <LoadingState />;
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Header
        role={role}
        title={`Welcome, ${me.name.split(" ")[0]}`}
        sub={`${snapshot.me.user.email} · zone ${me.zone}`}
      />

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <KPI
          icon={CalendarClock}
          label="Hours today"
          value={`${me.hoursToday}h`}
          tone="text-primary"
        />
        <KPI icon={Activity} label="Performance" value={String(me.performance)} tone="text-gold" />
        <KPI
          icon={ShieldCheck}
          label="Fatigue"
          value={`${me.fatigue}%`}
          tone={me.fatigue > 70 ? "text-destructive" : "text-success"}
        />
        <KPI icon={ClipboardList} label="Status" value={me.status} tone="text-primary" />
      </div>

      {topMatch && (
        <section className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <div className="text-xs font-medium uppercase tracking-wider text-primary">
            Next assignment
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold">
            {INCIDENT_LABEL[topMatch.incident.type]} · {topMatch.incident.zone}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{topMatch.incident.note}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            <span className="rounded-full bg-background px-3 py-1">
              ETA {topMatch.match!.etaMin} min
            </span>
            <span className="rounded-full bg-background px-3 py-1">
              Match score {topMatch.match!.score}
            </span>
            <span
              className={`rounded-full px-3 py-1 ${
                topMatch.incident.severity === "critical"
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-warning/80 text-foreground"
              }`}
            >
              {topMatch.incident.severity}
            </span>
          </div>
          <div className="mt-5 flex gap-3">
            <Link
              to="/dashboard/my-tasks"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-glow"
            >
              Open my tasks
            </Link>
            <Link
              to="/dashboard/sos"
              className="rounded-md border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10"
            >
              <ShieldAlert className="mr-1 inline h-4 w-4" /> SOS
            </Link>
          </div>
        </section>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <QuickLink
          to="/dashboard/my-tasks"
          icon={ClipboardList}
          title="My tasks"
          copy="Open assignments matched to your skills."
        />
        <QuickLink
          to="/dashboard/my-shift"
          icon={CalendarClock}
          title="My shift"
          copy="Schedule, breaks, fatigue alerts."
        />
        <QuickLink
          to="/dashboard/assistant"
          icon={Brain}
          title="Ask AI"
          copy="Where do I report? Who's my supervisor?"
        />
      </div>
    </div>
  );
}

function Header({ role, title, sub }: { role: AppRole | null; title: string; sub: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wider text-primary">
        {role ? ROLE_LABEL[role] : "-"} workspace
      </div>
      <h1 className="mt-1 font-display text-4xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

function OpenIncidentsCard({
  incidents,
}: {
  incidents: NonNullable<ReturnType<typeof useOperationsSnapshot>["data"]>["incidents"];
}) {
  const open = incidents.filter((incident) => incident.status !== "resolved");
  return (
    <section className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
      <header className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Open incidents</h2>
        <Link
          to="/dashboard/emergency"
          className="text-xs font-medium text-primary hover:underline"
        >
          View all {"->"}
        </Link>
      </header>
      <ul className="mt-4 divide-y divide-border">
        {open.map((incident) => (
          <li key={incident.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <span
                className={`grid h-9 w-9 place-items-center rounded-lg ${severityBg(incident.severity)}`}
              >
                <HeartPulse className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-semibold">
                  {INCIDENT_LABEL[incident.type]} · {incident.zone}
                </div>
                <div className="text-xs text-muted-foreground">
                  {incident.incidentCode} · {incident.note}
                </div>
              </div>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${severityBadge(incident.severity)}`}
            >
              {incident.severity}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ShortageCard({
  forecasts,
}: {
  forecasts: NonNullable<ReturnType<typeof useOperationsSnapshot>["data"]>["forecasts"];
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <header className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Shortage forecast</h2>
        <Brain className="h-4 w-4 text-primary" />
      </header>
      <p className="text-xs text-muted-foreground">AI projection - next 90 min</p>
      <ul className="mt-4 space-y-3">
        {forecasts.map((forecast) => (
          <li key={forecast.zone} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{forecast.zone}</div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                  forecast.risk === "high"
                    ? "bg-destructive/15 text-destructive"
                    : forecast.risk === "medium"
                      ? "bg-warning/20 text-warning"
                      : "bg-success/15 text-success"
                }`}
              >
                {forecast.risk}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>In {forecast.in}</span>
              <span className="font-medium text-foreground">{forecast.need}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function KPI({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <div className={`mt-3 font-display text-3xl font-bold ${tone}`}>{value}</div>
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  title,
  copy,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  copy: string;
}) {
  return (
    <Link
      to={to as "/dashboard"}
      className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-elegant"
    >
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 font-display text-base font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{copy}</p>
    </Link>
  );
}

function severityBg(severity: string) {
  if (severity === "critical") return "bg-destructive/15 text-destructive";
  if (severity === "high") return "bg-warning/20 text-warning";
  if (severity === "medium") return "bg-gold/15 text-gold";
  return "bg-muted text-muted-foreground";
}

function severityBadge(severity: string) {
  if (severity === "critical") return "bg-destructive text-destructive-foreground";
  if (severity === "high") return "bg-warning/80 text-foreground";
  if (severity === "medium") return "bg-gold/80 text-gold-foreground";
  return "bg-muted text-muted-foreground";
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-muted-foreground">
      Loading live operations...
    </div>
  );
}
