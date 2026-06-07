import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { INCIDENTS, INCIDENT_LABEL, VOLUNTEERS, ZONES, type Incident, type Volunteer } from "@/lib/sample-data";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/dashboard/map")({
  component: () => <RoleGate allow={["admin", "zone_manager"]}><CommandMap /></RoleGate>,
});

type Layer = "volunteers" | "incidents" | "density";

function CommandMap() {
  const [layers, setLayers] = useState<Record<Layer, boolean>>({
    volunteers: true, incidents: true, density: true,
  });
  const [sel, setSel] = useState<{ kind: "v"; data: Volunteer } | { kind: "i"; data: Incident } | null>(null);

  const toggle = (l: Layer) => setLayers((s) => ({ ...s, [l]: !s[l] }));

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Live Command Map</h1>
          <p className="text-sm text-muted-foreground">Volunteers, incidents, and crowd density across all zones.</p>
        </div>
        <div className="flex gap-2 text-xs">
          {(Object.keys(layers) as Layer[]).map((l) => (
            <button key={l} onClick={() => toggle(l)}
              className={`rounded-full border px-3 py-1.5 font-medium capitalize transition ${
                layers[l] ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}>
              {l}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-sidebar">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-[520px] w-full">
            {/* River */}
            <path d="M0,55 C20,40 40,70 60,50 S90,60 100,45 L100,75 L0,75 Z" fill="oklch(0.32 0.08 230 / 0.45)" />
            <path d="M0,55 C20,40 40,70 60,50 S90,60 100,45" stroke="oklch(0.7 0.1 220 / 0.6)" strokeWidth="0.4" fill="none" />

            {/* Grid */}
            {Array.from({ length: 10 }).map((_, i) => (
              <g key={i} stroke="oklch(0.96 0.01 95 / 0.04)" strokeWidth="0.2">
                <line x1={i * 10} y1={0} x2={i * 10} y2={100} />
                <line x1={0} y1={i * 10} x2={100} y2={i * 10} />
              </g>
            ))}

            {/* Density heatmap */}
            {layers.density && ZONES.map((z) => (
              <circle key={`d-${z.id}`} cx={z.x} cy={z.y} r={6 + (z.density / 100) * 12}
                fill={`oklch(${0.7 - z.density / 200} ${0.15} ${z.density > 70 ? 25 : z.density > 50 ? 75 : 160} / 0.35)`} />
            ))}

            {/* Zone labels */}
            {ZONES.map((z) => (
              <g key={`zl-${z.id}`}>
                <circle cx={z.x} cy={z.y} r="0.8" fill="oklch(0.78 0.14 85)" />
                <text x={z.x + 1.5} y={z.y - 1.5} fontSize="2.2" fill="oklch(0.96 0.01 95 / 0.8)" fontFamily="Inter">
                  {z.name}
                </text>
              </g>
            ))}

            {/* Volunteers */}
            {layers.volunteers && VOLUNTEERS.map((v) => (
              <circle key={v.id} cx={v.x} cy={v.y} r="0.9"
                fill={v.status === "available" ? "oklch(0.7 0.16 155)" : v.status === "busy" ? "oklch(0.78 0.15 75)" : v.status === "sos" ? "oklch(0.6 0.25 27)" : "oklch(0.5 0.02 95)"}
                onClick={() => setSel({ kind: "v", data: v })}
                style={{ cursor: "pointer" }}
              />
            ))}

            {/* Incidents */}
            {layers.incidents && INCIDENTS.filter((i) => i.status !== "resolved").map((i) => (
              <g key={i.id} onClick={() => setSel({ kind: "i", data: i })} style={{ cursor: "pointer" }}>
                <circle cx={i.x} cy={i.y} r="3.5" fill="none"
                  stroke={i.severity === "critical" ? "oklch(0.6 0.25 27)" : "oklch(0.78 0.15 75)"}
                  strokeWidth="0.5">
                  <animate attributeName="r" values="2.5;4.5;2.5" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={i.x} cy={i.y} r="1.6"
                  fill={i.severity === "critical" ? "oklch(0.6 0.25 27)" : "oklch(0.78 0.15 75)"} />
              </g>
            ))}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 flex gap-3 rounded-lg bg-sidebar/80 px-3 py-2 text-[11px] text-sidebar-foreground backdrop-blur">
            <Legend dot="oklch(0.7 0.16 155)" label="Available" />
            <Legend dot="oklch(0.78 0.15 75)" label="Busy" />
            <Legend dot="oklch(0.6 0.25 27)" label="Incident / SOS" />
            <Legend dot="oklch(0.78 0.14 85)" label="Zone" />
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-base font-semibold">Inspector</h3>
          {!sel && <p className="mt-2 text-xs text-muted-foreground">Click any volunteer or incident on the map.</p>}
          {sel?.kind === "v" && (
            <div className="mt-3 space-y-2 text-sm">
              <div className="font-semibold">{sel.data.name}</div>
              <div className="text-xs text-muted-foreground">{sel.data.id} · {sel.data.zone}</div>
              <Row k="Status" v={sel.data.status} />
              <Row k="Skills" v={sel.data.skills.join(", ")} />
              <Row k="Languages" v={sel.data.languages.join(", ")} />
              <Row k="Performance" v={`${sel.data.performance}/100`} />
              <Row k="Fatigue" v={`${sel.data.fatigue}%`} />
              <Row k="Hours today" v={`${sel.data.hoursToday}h`} />
            </div>
          )}
          {sel?.kind === "i" && (
            <div className="mt-3 space-y-2 text-sm">
              <div className="font-semibold">{INCIDENT_LABEL[sel.data.type]}</div>
              <div className="text-xs text-muted-foreground">{sel.data.id} · {sel.data.zone}</div>
              <Row k="Severity" v={sel.data.severity} />
              <Row k="Status" v={sel.data.status} />
              <Row k="Requires" v={sel.data.required.join(", ")} />
              <p className="text-xs text-muted-foreground">{sel.data.note}</p>
            </div>
          )}

          <div className="mt-6 border-t border-border pt-4">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Zone density</h4>
            <ul className="mt-2 space-y-2">
              {ZONES.slice(0, 5).map((z) => (
                <li key={z.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{z.name}</span><span className="font-medium">{z.density}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full" style={{ width: `${z.density}%`, background: z.density > 70 ? "oklch(0.6 0.22 27)" : z.density > 50 ? "oklch(0.78 0.15 75)" : "oklch(0.62 0.16 155)" }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: dot }} /> {label}
    </span>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{k}</span><span className="font-medium capitalize">{v}</span>
    </div>
  );
}
