import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess } from "../utils/response.js";
import { listIncidents } from "../services/data-store.service.js";
import {
  changeIncidentStatus,
  createIncident,
  resolveIncident,
  triggerSosAlert,
} from "../services/incident.service.js";
import { emitNotificationUpdated, emitOperationsUpdated } from "../socket/index.js";

export const list = asyncHandler(async (request, response) => {
  sendSuccess(
    response,
    await listIncidents({
      status: request.query.status,
      zoneId: request.query.zoneId,
    }),
  );
});

export const create = asyncHandler(async (request, response) => {
  const incident = await createIncident(request.body, request.auth);
  emitOperationsUpdated({ reason: "incident-created", incidentId: incident.id });
  emitNotificationUpdated({ reason: "incident-created" });
  sendSuccess(response, incident, "Incident created.", 201);
});

export const updateStatus = asyncHandler(async (request, response) => {
  const incident = await changeIncidentStatus(
    request.params.incidentId,
    request.body.status,
    request.auth,
  );
  emitOperationsUpdated({ reason: "incident-updated", incidentId: incident.id });
  sendSuccess(response, incident, "Incident updated.");
});

export const resolve = asyncHandler(async (request, response) => {
  const incident = await resolveIncident(request.params.incidentId, request.auth);
  emitOperationsUpdated({ reason: "incident-resolved", incidentId: incident.id });
  sendSuccess(response, incident, "Incident resolved.");
});

export const triggerSos = asyncHandler(async (request, response) => {
  const incident = await triggerSosAlert(request.body.kind, request.auth);
  emitOperationsUpdated({ reason: "sos-triggered", incidentId: incident.id });
  emitNotificationUpdated({ reason: "sos-triggered" });
  sendSuccess(response, incident, "SOS triggered.", 201);
});
