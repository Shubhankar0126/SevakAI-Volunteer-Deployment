import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess } from "../utils/response.js";
import { getAnalyticsData } from "../services/dashboard.service.js";

export const getAnalytics = asyncHandler(async (request, response) => {
  sendSuccess(response, await getAnalyticsData(request.auth));
});
