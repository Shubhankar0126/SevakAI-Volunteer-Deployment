// Mock dataset for SevakAI command center demonstrations.
// All coordinates are normalized 0–100 for use on a 100×100 SVG canvas.

export type Skill =
  | "medical"
  | "security"
  | "crowd"
  | "lost_found"
  | "translator"
  | "logistics"
  | "fire";

export type VolunteerStatus = "available" | "busy" | "off" | "sos";

export interface Volunteer {
  id: string;
  name: string;
  zone: string;
  skills: Skill[];
  languages: string[];
  performance: number; // 0–100
  fatigue: number; // 0–100 (higher = worse)
  hoursToday: number;
  status: VolunteerStatus;
  x: number;
  y: number;
  phone: string;
}

export type IncidentType =
  | "medical"
  | "lost_child"
  | "crowd_surge"
  | "fire"
  | "security"
  | "lost_item";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export interface Incident {
  id: string;
  type: IncidentType;
  zone: string;
  severity: IncidentSeverity;
  reportedAt: string; // ISO
  status: "open" | "dispatched" | "resolved";
  required: Skill[];
  x: number;
  y: number;
  note: string;
}

export interface Zone {
  id: string;
  name: string;
  density: number; // 0–100
  active: number;
  capacity: number;
  x: number;
  y: number;
}

export const ZONES: Zone[] = [
  { id: "Z1", name: "Sangam Nose", density: 92, active: 1840, capacity: 2200, x: 50, y: 48 },
  { id: "Z2", name: "Ghat 5 — Triveni", density: 78, active: 1120, capacity: 1500, x: 36, y: 32 },
  { id: "Z3", name: "Akhara Sector", density: 64, active: 980, capacity: 1400, x: 68, y: 28 },
  { id: "Z4", name: "Camp A-7", density: 41, active: 540, capacity: 1000, x: 22, y: 64 },
  { id: "Z5", name: "Parking P3", density: 35, active: 320, capacity: 800, x: 78, y: 70 },
  { id: "Z6", name: "Medical Camp 2", density: 58, active: 280, capacity: 500, x: 58, y: 76 },
  { id: "Z7", name: "Lost & Found Hub", density: 49, active: 210, capacity: 400, x: 30, y: 80 },
];

const NAMES = [
  "Aarav Sharma", "Priya Patel", "Rohit Verma", "Ananya Iyer", "Vikram Singh",
  "Meera Nair", "Kabir Joshi", "Ishita Rao", "Arjun Mehta", "Sneha Kulkarni",
  "Devansh Gupta", "Kavya Reddy", "Yash Malhotra", "Tanvi Bose", "Nikhil Khanna",
  "Riya Chatterjee", "Aditya Pillai", "Sara Das", "Manav Bhatt", "Pooja Menon",
  "Harsh Vardhan", "Neha Pandey", "Karan Kapoor", "Diya Saxena", "Rahul Choudhary",
];

const LANGS = ["Hindi", "English", "Bhojpuri", "Bengali", "Tamil", "Marathi", "Gujarati"];
const ALL_SKILLS: Skill[] = ["medical", "security", "crowd", "lost_found", "translator", "logistics", "fire"];

function rand<T>(arr: T[], n: number): T[] {
  const c = [...arr].sort(() => Math.random() - 0.5);
  return c.slice(0, n);
}

function seeded(i: number) {
  // Deterministic pseudo-random so reload doesn't reshuffle the demo
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export const VOLUNTEERS: Volunteer[] = Array.from({ length: 60 }).map((_, i) => {
  const zone = ZONES[i % ZONES.length];
  const r1 = seeded(i + 1);
  const r2 = seeded(i + 42);
  const r3 = seeded(i + 99);
  const skills = rand(ALL_SKILLS, 1 + Math.floor(r1 * 3));
  const status: VolunteerStatus =
    r2 > 0.85 ? "off" : r2 > 0.6 ? "busy" : r2 > 0.05 ? "available" : "sos";
  return {
    id: `V${1000 + i}`,
    name: NAMES[i % NAMES.length] + (i >= NAMES.length ? ` ${Math.floor(i / NAMES.length) + 1}` : ""),
    zone: zone.name,
    skills,
    languages: rand(LANGS, 1 + Math.floor(r3 * 2)),
    performance: 60 + Math.floor(r1 * 40),
    fatigue: Math.floor(r2 * 100),
    hoursToday: Math.round(r3 * 9 * 10) / 10,
    status,
    x: zone.x + (r1 - 0.5) * 14,
    y: zone.y + (r2 - 0.5) * 14,
    phone: `+91 9${Math.floor(100000000 + r3 * 899999999)}`,
  };
});

export const INCIDENTS: Incident[] = [
  {
    id: "INC-2041", type: "medical", zone: "Ghat 5 — Triveni", severity: "high",
    reportedAt: new Date(Date.now() - 4 * 60_000).toISOString(), status: "open",
    required: ["medical"], x: 34, y: 30, note: "Elderly pilgrim, suspected dehydration.",
  },
  {
    id: "INC-2042", type: "lost_child", zone: "Camp A-7", severity: "critical",
    reportedAt: new Date(Date.now() - 2 * 60_000).toISOString(), status: "open",
    required: ["lost_found", "security"], x: 24, y: 62, note: "8-year-old, red kurta, last seen near gate 3.",
  },
  {
    id: "INC-2043", type: "crowd_surge", zone: "Sangam Nose", severity: "high",
    reportedAt: new Date(Date.now() - 9 * 60_000).toISOString(), status: "dispatched",
    required: ["crowd", "security"], x: 50, y: 48, note: "Density >90% at northern approach.",
  },
  {
    id: "INC-2044", type: "lost_item", zone: "Lost & Found Hub", severity: "low",
    reportedAt: new Date(Date.now() - 22 * 60_000).toISOString(), status: "open",
    required: ["lost_found"], x: 30, y: 80, note: "Wallet with ID, owner waiting.",
  },
  {
    id: "INC-2045", type: "fire", zone: "Parking P3", severity: "medium",
    reportedAt: new Date(Date.now() - 14 * 60_000).toISOString(), status: "dispatched",
    required: ["fire", "security"], x: 78, y: 70, note: "Small kitchen fire reported.",
  },
  {
    id: "INC-2046", type: "security", zone: "Akhara Sector", severity: "medium",
    reportedAt: new Date(Date.now() - 31 * 60_000).toISOString(), status: "resolved",
    required: ["security"], x: 68, y: 28, note: "Pickpocket suspect detained.",
  },
];

export const INCIDENT_LABEL: Record<IncidentType, string> = {
  medical: "Medical",
  lost_child: "Lost Child",
  crowd_surge: "Crowd Surge",
  fire: "Fire",
  security: "Security",
  lost_item: "Lost Item",
};

export const SKILL_LABEL: Record<Skill, string> = {
  medical: "Medical",
  security: "Security",
  crowd: "Crowd Mgmt",
  lost_found: "Lost & Found",
  translator: "Translator",
  logistics: "Logistics",
  fire: "Fire Response",
};

// --- AI Smart Assignment ---

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export interface MatchResult {
  volunteer: Volunteer;
  score: number;
  etaMin: number;
  breakdown: { skill: number; distance: number; workload: number; performance: number };
}

export function rankVolunteersForIncident(incident: Incident, vols = VOLUNTEERS): MatchResult[] {
  return vols
    .filter((v) => v.status === "available" || v.status === "busy")
    .map((v) => {
      const matchedSkills = v.skills.filter((s) => incident.required.includes(s)).length;
      const skill = Math.min(1, matchedSkills / incident.required.length);
      const d = distance(incident, v);
      const dist = Math.max(0, 1 - d / 60);
      const workload = 1 - Math.min(1, v.hoursToday / 8) * 0.6 - (v.fatigue / 100) * 0.4;
      const perf = v.performance / 100;
      const score = Math.round((skill * 0.45 + dist * 0.25 + workload * 0.15 + perf * 0.15) * 100);
      const etaMin = Math.max(1, Math.round(d * 0.25));
      return {
        volunteer: v,
        score,
        etaMin,
        breakdown: {
          skill: Math.round(skill * 100),
          distance: Math.round(dist * 100),
          workload: Math.round(Math.max(0, workload) * 100),
          performance: Math.round(perf * 100),
        },
      };
    })
    .sort((a, b) => b.score - a.score);
}

// --- Forecasts ---

export const SHORTAGE_FORECAST = [
  { zone: "Sangam Nose", in: "45 min", need: "+38 medical", risk: "high" as const },
  { zone: "Ghat 5 — Triveni", in: "60 min", need: "+22 crowd", risk: "medium" as const },
  { zone: "Camp A-7", in: "90 min", need: "+12 lost_found", risk: "low" as const },
];

export const HOURLY_LOAD = Array.from({ length: 24 }).map((_, h) => ({
  hour: `${h.toString().padStart(2, "0")}:00`,
  incidents: Math.round(20 + Math.sin((h - 4) / 24 * Math.PI * 2) * 18 + (h >= 5 && h <= 9 ? 30 : 0)),
  volunteers: Math.round(4000 + Math.sin((h - 6) / 24 * Math.PI * 2) * 1800 + (h >= 4 && h <= 11 ? 1500 : 0)),
}));

export const ZONE_PERFORMANCE = ZONES.map((z) => ({
  zone: z.name,
  responseMin: Math.round((100 - z.density) / 20 + 2 + Math.random() * 2),
  satisfaction: 78 + Math.round(Math.random() * 18),
}));
