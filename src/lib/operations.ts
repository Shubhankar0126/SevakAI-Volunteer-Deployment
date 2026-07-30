export type Skill =
  "medical" | "security" | "crowd" | "lost_found" | "translator" | "logistics" | "fire";

export type VolunteerStatus = "available" | "busy" | "off" | "sos";
export type AppRole = "admin" | "zone_manager" | "volunteer";
export type IncidentType =
  "medical" | "lost_child" | "crowd_surge" | "fire" | "security" | "lost_item";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "open" | "dispatched" | "resolved";

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: AppRole;
  avatarUrl?: string;
}

export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  zoneId: string;
  zone: string;
  languages: string[];
  skills: Skill[];
  avatarUrl?: string;
}

export interface Volunteer {
  id: string;
  userId?: string | null;
  volunteerCode: string;
  name: string;
  zoneId: string;
  zone: string;
  skills: Skill[];
  languages: string[];
  performance: number;
  fatigue: number;
  hoursToday: number;
  status: VolunteerStatus;
  x: number;
  y: number;
  phone: string;
}

export interface ZoneManager {
  id: string;
  userId: string;
  zoneId: string;
  zone: string;
  phone: string;
  shift: string;
}

export interface Zone {
  id: string;
  zoneCode?: string;
  name: string;
  density: number;
  active: number;
  capacity: number;
  x: number;
  y: number;
  status?: string;
}

export interface Incident {
  id: string;
  incidentCode: string;
  type: IncidentType;
  zoneId: string;
  zone: string;
  severity: IncidentSeverity;
  reportedAt: string;
  status: IncidentStatus;
  required: Skill[];
  x: number;
  y: number;
  note: string;
}

export interface Forecast {
  id?: string;
  zoneId: string;
  zone: string;
  in: string;
  need: string;
  risk: "low" | "medium" | "high";
}

export interface NotificationItem {
  id: string;
  type: "info" | "success" | "warning" | "critical";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ShiftEntry {
  time: string;
  activity: string;
  break?: boolean;
}

export interface ChartPoint {
  hour: string;
  incidents: number;
  volunteers: number;
}

export interface ZonePerformancePoint {
  zoneId: string;
  zone: string;
  responseMin: number;
  satisfaction: number;
}

export interface AssignmentRecord {
  id: string;
  incidentId: string;
  volunteerId: string;
  volunteerUserId?: string | null;
  score: number;
  etaMin: number;
  status: string;
  dispatchedAt?: string;
}

export interface TaskSummary {
  id: string;
  incidentId: string;
  title: string;
  details: string;
  zone: string;
  severity: IncidentSeverity;
  etaMin: number;
  score: number;
  status: string;
}

export interface AuthPayload {
  user: AuthenticatedUser;
  role: AppRole;
  profile: Profile | null;
  volunteer: Volunteer | null;
  zoneManager: ZoneManager | null;
}

export interface OperationsSnapshot {
  me: AuthPayload;
  zones: Zone[];
  volunteers: Volunteer[];
  incidents: Incident[];
  forecasts: Forecast[];
  notifications: NotificationItem[];
  hourlyLoad: ChartPoint[];
  zonePerformance: ZonePerformancePoint[];
  assignments: AssignmentRecord[];
  myTasks: TaskSummary[];
  myShift: ShiftEntry[];
  stats: {
    activeVolunteers: number;
    availableVolunteers: number;
    openIncidents: number;
    averagePerformance: number;
  };
}

export interface AttendanceRecord {
  id: string;
  date: string;
  shiftStart: string;
  shiftEnd: string;
  hoursWorked: number;
  status: string;
}

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

function distance(left: { x: number; y: number }, right: { x: number; y: number }) {
  return Math.sqrt((left.x - right.x) ** 2 + (left.y - right.y) ** 2);
}

export interface MatchResult {
  volunteer: Volunteer;
  score: number;
  etaMin: number;
  breakdown: {
    skill: number;
    distance: number;
    workload: number;
    performance: number;
  };
}

export function rankVolunteersForIncident(
  incident: Incident,
  volunteers: Volunteer[],
): MatchResult[] {
  return volunteers
    .filter((volunteer) => volunteer.status === "available" || volunteer.status === "busy")
    .map((volunteer) => {
      const matchedSkills = volunteer.skills.filter((skill) =>
        incident.required.includes(skill),
      ).length;
      const skill = Math.min(1, matchedSkills / incident.required.length);
      const dist = Math.max(0, 1 - distance(incident, volunteer) / 60);
      const workload =
        1 - Math.min(1, volunteer.hoursToday / 8) * 0.6 - (volunteer.fatigue / 100) * 0.4;
      const performance = volunteer.performance / 100;
      const score = Math.round(
        (skill * 0.45 + dist * 0.25 + workload * 0.15 + performance * 0.15) * 100,
      );
      const etaMin = Math.max(1, Math.round(distance(incident, volunteer) * 0.25));

      return {
        volunteer,
        score,
        etaMin,
        breakdown: {
          skill: Math.round(skill * 100),
          distance: Math.round(dist * 100),
          workload: Math.round(Math.max(0, workload) * 100),
          performance: Math.round(performance * 100),
        },
      };
    })
    .sort((left, right) => right.score - left.score);
}
