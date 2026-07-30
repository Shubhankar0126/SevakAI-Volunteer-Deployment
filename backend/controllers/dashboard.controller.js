import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess } from "../utils/response.js";
import {
  getAnalyticsData,
  getDashboardSnapshot,
  getMapData,
  getOverviewData,
} from "../services/dashboard.service.js";

export const snapshot = asyncHandler(async (request, response) => {
  sendSuccess(response, await getDashboardSnapshot(request.auth));
});

export const overview = asyncHandler(async (request, response) => {
  sendSuccess(response, await getOverviewData(request.auth));
});

export const mapData = asyncHandler(async (request, response) => {
  sendSuccess(response, await getMapData(request.auth));
});

export const analytics = asyncHandler(async (request, response) => {
  sendSuccess(response, await getAnalyticsData(request.auth));
});
