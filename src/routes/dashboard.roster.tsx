import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { VOLUNTEERS, SKILL_LABEL, type Skill, type VolunteerStatus } from "@/lib/sample-data";
import { Input } from "@/components/ui/input";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/dashboard/roster")({
  component: () => <RoleGate allow={["admin", "zone_manager"]}><Roster /></RoleGate>,
});

function Roster() {
  const [q, setQ] = useState("");
  const [skill, setSkill] = useState<Skill | "all">("all");
  const [status, setStatus] = useState<VolunteerStatus | "all">("all");

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return VOLUNTEERS.filter((v) => {
      if (skill !== "all" && !v.skills.includes(skill)) return false;
      if (status !== "all" && v.status !== status) return false;
      if (t && !v.name.toLowerCase().includes(t) && !v.zone.toLowerCase().includes(t) && !v.id.toLowerCase().includes(t)) return false;
      return true;
    });
  }, [q, skill, status]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Volunteer Roster</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} of {VOLUNTEERS.length} volunteers</p>
      </header>

      <div className="mb-4 flex flex-wrap gap-3">
        <Input placeholder="Search name, ID, zone…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <select value={skill} onChange={(e) => setSkill(e.target.value as Skill | "all")}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="all">All skills</option>
          {(Object.keys(SKILL_LABEL) as Skill[]).map((s) => <option key={s} value={s}>{SKILL_LABEL[s]}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as VolunteerStatus | "all")}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm">
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
            {filtered.map((v) => (
              <tr key={v.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-medium">{v.name}</div>
                  <div className="text-xs text-muted-foreground">{v.id} · {v.languages.join(", ")}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{v.zone}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {v.skills.map((s) => <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">{s}</span>)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                    v.status === "available" ? "bg-success/15 text-success" :
                    v.status === "busy" ? "bg-warning/20 text-warning" :
                    v.status === "sos" ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground"
                  }`}>{v.status}</span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-primary">{v.performance}</td>
                <td className={`px-4 py-3 text-right font-medium ${v.fatigue > 70 ? "text-destructive" : v.fatigue > 45 ? "text-warning" : "text-success"}`}>{v.fatigue}%</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{v.hoursToday}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
