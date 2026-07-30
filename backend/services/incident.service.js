import {
  createActivityLogEntry,
  createIncidentRecord,
  createNotificationEntry,
  getIncidentById,
  updateIncidentStatus,
} from "./data-store.service.js";

function buildSosPayload(kind, userContext) {
  const zoneId = userContext.volunteer?.zoneId ?? userContext.profile?.zoneId ?? "Z1";
  const zone = userContext.volunteer?.zone ?? userContext.profile?.zone ?? "Sangam Nose";
  const x = userContext.volunteer?.x ?? 50;
  const y = userContext.volunteer?.y ?? 48;

  if (kind === "medical") {
    return {
      type: "medical",
      zoneId,
      zone,
      severity: "critical",
      note: "Volunteer medical backup requested from mobile SOS.",
      required: ["medical"],
      x,
      y,
    };
  }

  if (kind === "crowd") {
    return {
      type: "crowd_surge",
      zoneId,
      zone,
      severity: "high",
      note: "Volunteer reported crowd surge through SOS panel.",
      required: ["crowd", "security"],
      x,
      y,
    };
  }

  return {
    type: "security",
    zoneId,
    zone,
    severity: "critical",
    note: "Critical SOS triggered by volunteer.",
    required: ["security", "medical"],
    x,
    y,
  };
}

export async function createIncident(payload, userContext) {
  const incident = await createIncidentRecord(payload, userContext);

  await createActivityLogEntry({
    userId: userContext.user.id,
    action: "incident_created",
    entityType: "incident",
    entityId: incident.id,
    meta: { incidentCode: incident.incidentCode, severity: incident.severity },
  });

  await createNotificationEntry({
    role: "admin",
    type: incident.severity === "critical" ? "critical" : "warning",
    title: "New incident reported",
    message: `${incident.incidentCode} opened in ${incident.zone}.`,
  });

  return incident;
}

export async function changeIncidentStatus(incidentId, status, userContext) {
  const incident = await updateIncidentStatus(incidentId, status);

  await createActivityLogEntry({
    userId: userContext.user.id,
    action: "incident_status_updated",
    entityType: "incident",
    entityId: incident.id,
    meta: { status },
  });

  return incident;
}

export async function triggerSosAlert(kind, userContext) {
  const payload = buildSosPayload(kind, userContext);
  const incident = await createIncident(payload, userContext);

  await createNotificationEntry({
    role: "zone_manager",
    type: "critical",
    title: "Volunteer SOS triggered",
    message: `${incident.incidentCode} opened near ${incident.zone}.`,
  });

  return incident;
}

export async function resolveIncident(incidentId, userContext) {
  return changeIncidentStatus(incidentId, "resolved", userContext);
}

export async function getIncidentOrThrow(incidentId) {
  const incident = await getIncidentById(incidentId);
  if (!incident) {
    throw new Error("Incident not found.");
  }
  return incident;
}
