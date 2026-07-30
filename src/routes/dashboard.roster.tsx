import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useOperationsSnapshot } from "@/hooks/use-operations";
import { SKILL_LABEL, type Skill, type VolunteerStatus } from "@/lib/operations";
import { Input } from "@/components/ui/input";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/dashboard/roster")({
  component: () => (
    <RoleGate allow={["admin", "zone_manager"]}>
      <Roster />
    </RoleGate>
  ),
});

function Roster() {
  const snapshotQuery = useOperationsSnapshot();
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState<Skill | "all">("all");
  const [status, setStatus] = useState<VolunteerStatus | "all">("all");

  const filtered = useMemo(() => {
    if (!snapshotQuery.data) {
      return [];
    }

    const text = query.toLowerCase();
    return snapshotQuery.data.volunteers.filter((volunteer) => {
      if (skill !== "all" && !volunteer.skills.includes(skill)) return false;
      if (status !== "all" && volunteer.status !== status) return false;
      if (
        text &&
        !volunteer.name.toLowerCase().includes(text) &&
        !volunteer.zone.toLowerCase().includes(text) &&
        !volunteer.volunteerCode.toLowerCase().includes(text)
      ) {
        return false;
      }
      return true;
    });
  }, [query, skill, snapshotQuery.data, status]);

  if (snapshotQuery.isLoading || !snapshotQuery.data) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-muted-foreground">
        Loading roster...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Volunteer Roster</h1>
        <p className="text-sm text-muted-foreground">
          {filtered.length} of {snapshotQuery.data.volunteers.length} volunteers
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Search name, ID, zone..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={skill}
          onChange={(e) => setSkill(e.target.value as Skill | "all")}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">All skills</option>
          {(Object.keys(SKILL_LABEL) as Skill[]).map((value) => (
            <option key={value} value={value}>
              {SKILL_LABEL[value]}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as VolunteerStatus | "all")}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="available">Available</option>
          <option value="busy">Busy</option>
          <option value="off">Off duty</option>
          <option value="sos">SOS</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Volunteer</th>
              <th className="px-4 py-3">Zone</th>
              <th className="px-4 py-3">Skills</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Perf</th>
              <th className="px-4 py-3 text-right">Fatigue</th>
              <th className="px-4 py-3 text-right">Hrs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((volunteer) => (
              <tr key={volunteer.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-medium">{volunteer.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {volunteer.volunteerCode} · {volunteer.languages.join(", ")}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{volunteer.zone}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {volunteer.skills.map((value) => (
                      <span
                        key={value}
                        className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary"
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                      volunteer.status === "available"
                        ? "bg-success/15 text-success"
                        : volunteer.status === "busy"
                          ? "bg-warning/20 text-warning"
                          : volunteer.status === "sos"
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {volunteer.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-primary">
                  {volunteer.performance}
                </td>
                <td
                  className={`px-4 py-3 text-right font-medium ${volunteer.fatigue > 70 ? "text-destructive" : volunteer.fatigue > 45 ? "text-warning" : "text-success"}`}
                >
                  {volunteer.fatigue}%
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {volunteer.hoursToday}h
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
