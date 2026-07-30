import { LANGUAGES, SAMPLE_NAMES, SHIFT_TEMPLATE, SKILLS, ZONE_BLUEPRINTS } from "./constants.js";

export function seeded(index) {
  const value = Math.sin(index * 9301 + 49297) * 233280;
  return value - Math.floor(value);
}

export function pickItems(collection, count, seedOffset) {
  const scored = collection
    .map((value, index) => ({
      value,
      score: seeded(index + seedOffset),
    }))
    .sort((left, right) => left.score - right.score);

  return scored.slice(0, count).map((entry) => entry.value);
}

export function buildZones() {
  return ZONE_BLUEPRINTS.map((zone) => ({
    ...zone,
    status: zone.density > 80 ? "critical" : zone.density > 60 ? "stressed" : "healthy",
  }));
}

export function buildVolunteerBlueprints() {
  const zones = buildZones();

  return Array.from({ length: 60 }).map((_, index) => {
    const zone = zones[index % zones.length];
    const skillSeed = seeded(index + 1);
    const statusSeed = seeded(index + 42);
    const languageSeed = seeded(index + 99);
    const skills = pickItems(SKILLS, 1 + Math.floor(skillSeed * 3), index + 11);

    return {
      volunteerCode: `V${1000 + index}`,
      name:
        SAMPLE_NAMES[index % SAMPLE_NAMES.length] +
        (index >= SAMPLE_NAMES.length ? ` ${Math.floor(index / SAMPLE_NAMES.length) + 1}` : ""),
      zoneId: zone.id,
      zone: zone.name,
      skills,
      languages: pickItems(LANGUAGES, 1 + Math.floor(languageSeed * 2), index + 57),
      performance: 60 + Math.floor(skillSeed * 40),
      fatigue: Math.floor(statusSeed * 100),
      hoursToday: Math.round(languageSeed * 9 * 10) / 10,
      status:
        statusSeed > 0.85
          ? "off"
          : statusSeed > 0.6
            ? "busy"
            : statusSeed > 0.05
              ? "available"
              : "sos",
      x: zone.x + (skillSeed - 0.5) * 14,
      y: zone.y + (statusSeed - 0.5) * 14,
      phone: `+91 9${Math.floor(100000000 + languageSeed * 899999999)}`,
    };
  });
}

export function buildIncidentBlueprints() {
  const minutesAgo = (value) => new Date(Date.now() - value * 60_000).toISOString();

  return [
    {
      incidentCode: "INC-2041",
      type: "medical",
      zoneId: "Z2",
      zone: "Ghat 5 - Triveni",
      severity: "high",
      reportedAt: minutesAgo(4),
      status: "open",
      required: ["medical"],
      x: 34,
      y: 30,
      note: "Elderly pilgrim, suspected dehydration.",
    },
    {
      incidentCode: "INC-2042",
      type: "lost_child",
      zoneId: "Z4",
      zone: "Camp A-7",
      severity: "critical",
      reportedAt: minutesAgo(2),
      status: "open",
      required: ["lost_found", "security"],
      x: 24,
      y: 62,
      note: "8-year-old in red kurta last seen near gate 3.",
    },
    {
      incidentCode: "INC-2043",
      type: "crowd_surge",
      zoneId: "Z1",
      zone: "Sangam Nose",
      severity: "high",
      reportedAt: minutesAgo(9),
      status: "dispatched",
      required: ["crowd", "security"],
      x: 50,
      y: 48,
      note: "Density above 90 percent at northern approach.",
    },
    {
      incidentCode: "INC-2044",
      type: "lost_item",
      zoneId: "Z7",
      zone: "Lost and Found Hub",
      severity: "low",
      reportedAt: minutesAgo(22),
      status: "open",
      required: ["lost_found"],
      x: 30,
      y: 80,
      note: "Wallet with ID, owner waiting at kiosk 4.",
    },
    {
      incidentCode: "INC-2045",
      type: "fire",
      zoneId: "Z5",
      zone: "Parking P3",
      severity: "medium",
      reportedAt: minutesAgo(14),
      status: "dispatched",
      required: ["fire", "security"],
      x: 78,
      y: 70,
      note: "Small kitchen fire reported near vendor row.",
    },
    {
      incidentCode: "INC-2046",
      type: "security",
      zoneId: "Z3",
      zone: "Akhara Sector",
      severity: "medium",
      reportedAt: minutesAgo(31),
      status: "resolved",
      required: ["security"],
      x: 68,
      y: 28,
      note: "Pickpocket suspect detained.",
    },
  ];
}

export function buildForecasts() {
  return [
    { zoneId: "Z1", zone: "Sangam Nose", in: "45 min", need: "+38 medical", risk: "high" },
    { zoneId: "Z2", zone: "Ghat 5 - Triveni", in: "60 min", need: "+22 crowd", risk: "medium" },
    { zoneId: "Z4", zone: "Camp A-7", in: "90 min", need: "+12 lost_found", risk: "low" },
  ];
}

export function buildHourlyLoad() {
  return Array.from({ length: 24 }).map((_, hour) => ({
    hour: `${hour.toString().padStart(2, "0")}:00`,
    incidents: Math.round(
      20 + Math.sin(((hour - 4) / 24) * Math.PI * 2) * 18 + (hour >= 5 && hour <= 9 ? 30 : 0),
    ),
    volunteers: Math.round(
      4000 +
        Math.sin(((hour - 6) / 24) * Math.PI * 2) * 1800 +
        (hour >= 4 && hour <= 11 ? 1500 : 0),
    ),
  }));
}

export function buildZonePerformance(zones) {
  return zones.map((zone, index) => ({
    zoneId: zone.id,
    zone: zone.name,
    responseMin: Math.round((100 - zone.density) / 20 + 2 + seeded(index + 700) * 2),
    satisfaction: 78 + Math.round(seeded(index + 900) * 18),
  }));
}

export function distance(left, right) {
  return Math.sqrt((left.x - right.x) ** 2 + (left.y - right.y) ** 2);
}

export function rankVolunteersForIncident(incident, volunteers) {
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

export function buildShift(volunteer) {
  return SHIFT_TEMPLATE.map((entry, index) => ({
    ...entry,
    activity: entry.break
      ? entry.activity
      : index === 0
        ? `${volunteer.zone} support`
        : index === 2
          ? `${volunteer.zone} triage`
          : `${volunteer.zone} crowd watch`,
  }));
}
