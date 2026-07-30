import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess } from "../utils/response.js";
import {
  autoDispatchIncident,
  getIncidentRecommendations,
} from "../services/assignment.service.js";
import { emitNotificationUpdated, emitOperationsUpdated } from "../socket/index.js";

export const recommendations = asyncHandler(async (request, response) => {
  const limit = Number(request.query.limit ?? 8);
  sendSuccess(response, await getIncidentRecommendations(request.params.incidentId, limit));
});

export const dispatch = asyncHandler(async (request, response) => {
  const matches = await autoDispatchIncident(
    request.params.incidentId,
    request.body.limit,
    request.auth,
  );
  emitOperationsUpdated({ reason: "incident-dispatched", incidentId: request.params.incidentId });
  emitNotificationUpdated({ reason: "incident-dispatched" });
  sendSuccess(response, matches, "Responders dispatched.");
});
