import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess } from "../utils/response.js";
import { getReportSummary } from "../services/report.service.js";

export const summary = asyncHandler(async (request, response) => {
  sendSuccess(response, await getReportSummary(request.auth));
});
