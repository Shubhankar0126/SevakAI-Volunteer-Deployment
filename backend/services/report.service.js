import { buildReportSummary } from "./data-store.service.js";

export async function getReportSummary(userContext) {
  return buildReportSummary(userContext);
}
