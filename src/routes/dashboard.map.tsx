import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { INCIDENT_LABEL, type Incident, type Volunteer } from "@/lib/operations";
import { useOperationsSnapshot } from "@/hooks/use-operations";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/dashboard/map")({
  component: () => (
    <RoleGate allow={["admin", "zone_manager"]}>
      <CommandMap />
    </RoleGate>
  ),
});

type Layer = "volunteers" | "incidents" | "density";

function CommandMap() {
  const snapshotQuery = useOperationsSnapshot();
  const [layers, setLayers] = useState<Record<Layer, boolean>>({
    volunteers: true,
    incidents: true,
    density: true,
  });
  const [selected, setSelected] = useState<
    { kind: "v"; data: Volunteer } | { kind: "i"; data: Incident } | null
  >(null);

  if (snapshotQuery.isLoading || !snapshotQuery.data) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-muted-foreground">
        Loading command map...
      </div>
    );
  }

  const { zones, volunteers, incidents } = snapshotQuery.data;
  const toggle = (layer: Layer) => setLayers((state) => ({ ...state, [layer]: !state[layer] }));

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Live Command Map</h1>
          <p className="text-sm text-muted-foreground">
            Volunteers, incidents, and crowd density across all zones.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          {(Object.keys(layers) as Layer[]).map((layer) => (
            <button
              key={layer}
              onClick={() => toggle(layer)}
              className={`rounded-full border px-3 py-1.5 font-medium capitalize transition ${
                layers[layer]
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {layer}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-sidebar">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-[520px] w-full">
            <path
              d="M0,55 C20,40 40,70 60,50 S90,60 100,45 L100,75 L0,75 Z"
              fill="oklch(0.32 0.08 230 / 0.45)"
            />
            <path
              d="M0,55 C20,40 40,70 60,50 S90,60 100,45"
              stroke="oklch(0.7 0.1 220 / 0.6)"
              strokeWidth="0.4"
              fill="none"
            />

            {Array.from({ length: 10 }).map((_, index) => (
              <g key={index} stroke="oklch(0.96 0.01 95 / 0.04)" strokeWidth="0.2">
                <line x1={index * 10} y1={0} x2={index * 10} y2={100} />
                <line x1={0} y1={index * 10} x2={100} y2={index * 10} />
              </g>
            ))}

            {layers.density &&
              zones.map((zone) => (
                <circle
                  key={`density-${zone.id}`}
                  cx={zone.x}
                  cy={zone.y}
                  r={6 + (zone.density / 100) * 12}
                  fill={`oklch(${0.7 - zone.density / 200} ${0.15} ${zone.density > 70 ? 25 : zone.density > 50 ? 75 : 160} / 0.35)`}
                />
              ))}

            {zones.map((zone) => (
              <g key={`zone-${zone.id}`}>
                <circle cx={zone.x} cy={zone.y} r="0.8" fill="oklch(0.78 0.14 85)" />
                <text
                  x={zone.x + 1.5}
                  y={zone.y - 1.5}
                  fontSize="2.2"
                  fill="oklch(0.96 0.01 95 / 0.8)"
                  fontFamily="Inter"
                >
                  {zone.name}
                </text>
              </g>
            ))}

            {layers.volunteers &&
              volunteers.map((volunteer) => (
                <circle
                  key={volunteer.id}
                  cx={volunteer.x}
                  cy={volunteer.y}
                  r="0.9"
                  fill={
                    volunteer.status === "available"
                      ? "oklch(0.7 0.16 155)"
                      : volunteer.status === "busy"
                        ? "oklch(0.78 0.15 75)"
                        : volunteer.status === "sos"
                          ? "oklch(0.6 0.25 27)"
                          : "oklch(0.5 0.02 95)"
                  }
                  onClick={() => setSelected({ kind: "v", data: volunteer })}
                  style={{ cursor: "pointer" }}
                />
              ))}

            {layers.incidents &&
              incidents
                .filter((incident) => incident.status !== "resolved")
                .map((incident) => (
                  <g
                    key={incident.id}
                    onClick={() => setSelected({ kind: "i", data: incident })}
                    style={{ cursor: "pointer" }}
                  >
                    <circle
                      cx={incident.x}
                      cy={incident.y}
                      r="3.5"
                      fill="none"
                      stroke={
                        incident.severity === "critical"
                          ? "oklch(0.6 0.25 27)"
                          : "oklch(0.78 0.15 75)"
                      }
                      strokeWidth="0.5"
                    >
                      <animate
                        attributeName="r"
                        values="2.5;4.5;2.5"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="1;0.3;1"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      cx={incident.x}
                      cy={incident.y}
                      r="1.6"
                      fill={
                        incident.severity === "critical"
                          ? "oklch(0.6 0.25 27)"
                          : "oklch(0.78 0.15 75)"
                      }
                    />
                  </g>
                ))}
          </svg>

          <div className="absolute bottom-3 left-3 flex gap-3 rounded-lg bg-sidebar/80 px-3 py-2 text-[11px] text-sidebar-foreground backdrop-blur">
            <Legend dot="oklch(0.7 0.16 155)" label="Available" />
            <Legend dot="oklch(0.78 0.15 75)" label="Busy" />
            <Legend dot="oklch(0.6 0.25 27)" label="Incident / SOS" />
            <Legend dot="oklch(0.78 0.14 85)" label="Zone" />
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-base font-semibold">Inspector</h3>
          {!selected && (
            <p className="mt-2 text-xs text-muted-foreground">
              Click any volunteer or incident on the map.
            </p>
          )}
          {selected?.kind === "v" && (
            <div className="mt-3 space-y-2 text-sm">
              <div className="font-semibold">{selected.data.name}</div>
              <div className="text-xs text-muted-foreground">
                {selected.data.volunteerCode} · {selected.data.zone}
              </div>
              <Row label="Status" value={selected.data.status} />
              <Row label="Skills" value={selected.data.skills.join(", ")} />
              <Row label="Languages" value={selected.data.languages.join(", ")} />
              <Row label="Performance" value={`${selected.data.performance}/100`} />
              <Row label="Fatigue" value={`${selected.data.fatigue}%`} />
              <Row label="Hours today" value={`${selected.data.hoursToday}h`} />
            </div>
          )}
          {selected?.kind === "i" && (
            <div className="mt-3 space-y-2 text-sm">
              <div className="font-semibold">{INCIDENT_LABEL[selected.data.type]}</div>
              <div className="text-xs text-muted-foreground">
                {selected.data.incidentCode} · {selected.data.zone}
              </div>
              <Row label="Severity" value={selected.data.severity} />
              <Row label="Status" value={selected.data.status} />
              <Row label="Requires" value={selected.data.required.join(", ")} />
              <p className="text-xs text-muted-foreground">{selected.data.note}</p>
            </div>
          )}

          <div className="mt-6 border-t border-border pt-4">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Zone density</h4>
            <ul className="mt-2 space-y-2">
              {zones.slice(0, 5).map((zone) => (
                <li key={zone.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{zone.name}</span>
                    <span className="font-medium">{zone.density}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full"
                      style={{
                        width: `${zone.density}%`,
                        background:
                          zone.density > 70
                            ? "oklch(0.6 0.22 27)"
                            : zone.density > 50
                              ? "oklch(0.78 0.15 75)"
                              : "oklch(0.62 0.16 155)",
                      }}
                    />
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  );
}
