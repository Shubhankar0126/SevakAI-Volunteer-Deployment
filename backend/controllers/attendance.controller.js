import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { sendSuccess } from "../utils/response.js";
import { createAttendanceEntry, getAttendanceForUser } from "../services/data-store.service.js";

export const myAttendance = asyncHandler(async (request, response) => {
  sendSuccess(response, await getAttendanceForUser(request.auth));
});

export const checkIn = asyncHandler(async (request, response) => {
  const volunteer = request.auth.volunteer;
  if (!volunteer) {
    throw new ApiError(403, "Only volunteers can record attendance.");
  }
  const attendance = await createAttendanceEntry({
    userId: request.auth.user.id,
    volunteerId: volunteer?.id ?? volunteer?._id,
    hoursWorked: volunteer?.hoursToday ?? 0,
  });
  sendSuccess(response, attendance, "Attendance recorded.", 201);
});
