import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess } from "../utils/response.js";
import { ApiError } from "../utils/api-error.js";
import { listVolunteers } from "../services/data-store.service.js";

export const list = asyncHandler(async (request, response) => {
  const volunteers = await listVolunteers({
    search: request.query.search ?? "",
    skill: request.query.skill ?? "all",
    status: request.query.status ?? "all",
  });

  sendSuccess(response, volunteers);
});

export const getOne = asyncHandler(async (request, response) => {
  const volunteers = await listVolunteers({});
  const volunteer = volunteers.find(
    (item) =>
      item.id === request.params.volunteerId || item.volunteerCode === request.params.volunteerId,
  );

  if (!volunteer) {
    throw new ApiError(404, "Volunteer not found.");
  }

  sendSuccess(response, volunteer);
});
