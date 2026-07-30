import {
  createActivityLogEntry,
  createNotificationEntry,
  dispatchIncidentAssignments,
  getIncidentById,
  getRecommendationsForIncident,
} from "./data-store.service.js";

export async function getIncidentRecommendations(incidentId, limit) {
  return getRecommendationsForIncident(incidentId, limit);
}

export async function autoDispatchIncident(incidentId, limit, userContext) {
  const incident = await getIncidentById(incidentId);
  const matches = await dispatchIncidentAssignments(incidentId, limit);

  await createActivityLogEntry({
    userId: userContext.user.id,
    action: "incident_dispatched",
    entityType: "incident",
    entityId: incident?.id ?? incidentId,
    meta: {
      incidentCode: incident?.incidentCode,
      responders: matches.map((match) => match.volunteer.name),
    },
  });

  await createNotificationEntry({
    role: "admin",
    type: "success",
    title: "Auto-dispatch completed",
    message: `${matches.length} responders routed to ${incident?.zone ?? "incident zone"}.`,
  });

  return matches;
}
