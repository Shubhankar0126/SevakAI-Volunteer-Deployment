import { createFileRoute } from "@tanstack/react-router";
import { HOURLY_LOAD, VOLUNTEERS, ZONE_PERFORMANCE, ZONES } from "@/lib/sample-data";
import { RoleGate } from "@/components/role-gate";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export const Route = createFileRoute("/dashboard/analytics")({
  component: () => <RoleGate allow={["admin"]}><Analytics /></RoleGate>,
});

function Analytics() {
  const fatigueBuckets = [
    { name: "Low (<40)", value: VOLUNTEERS.filter((v) => v.fatigue < 40).length },
    { name: "Medium (40–70)", value: VOLUNTEERS.filter((v) => v.fatigue >= 40 && v.fatigue < 70).length },
    { name: "High (≥70)", value: VOLUNTEERS.filter((v) => v.fatigue >= 70).length },
  ];
  const zoneLoad = ZONES.map((z) => ({ name: z.name.split(" ")[0], load: z.density, vols: z.active }));

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Operations, fatigue distribution, and zone performance.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Incidents & volunteers · last 24h">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={HOURLY_LOAD}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.52 0.13 162)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="oklch(0.52 0.13 162)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.74 0.13 85)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="oklch(0.74 0.13 85)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(0.88 0.015 95)" strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} interval={3} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area dataKey="volunteers" stroke="oklch(0.52 0.13 162)" fill="url(#g1)" name="Volunteers" />
              <Area dataKey="incidents" stroke="oklch(0.74 0.13 85)" fill="url(#g2)" name="Incidents" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Zone load (density %)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={zoneLoad}>
              <CartesianGrid stroke="oklch(0.88 0.015 95)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="load" fill="oklch(0.38 0.09 160)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Avg response time · per zone (min)">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={ZONE_PERFORMANCE}>
              <CartesianGrid stroke="oklch(0.88 0.015 95)" strokeDasharray="3 3" />
              <XAxis dataKey="zone" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="responseMin" stroke="oklch(0.55 0.22 27)" strokeWidth={2} name="Response (min)" />
              <Line type="monotone" dataKey="satisfaction" stroke="oklch(0.62 0.16 155)" strokeWidth={2} name="Satisfaction" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Fatigue distribution">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={fatigueBuckets} layout="vertical">
              <CartesianGrid stroke="oklch(0.88 0.015 95)" strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="oklch(0.74 0.13 85)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-3 font-display text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}
