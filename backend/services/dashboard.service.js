import { getOperationsSnapshot } from "./data-store.service.js";

export async function getDashboardSnapshot(userContext) {
  return getOperationsSnapshot(userContext);
}

export async function getOverviewData(userContext) {
  const snapshot = await getOperationsSnapshot(userContext);

  return {
    me: snapshot.me,
    stats: snapshot.stats,
    incidents: snapshot.incidents,
    zones: snapshot.zones,
    forecasts: snapshot.forecasts,
    myTasks: snapshot.myTasks,
    myShift: snapshot.myShift,
  };
}

export async function getMapData(userContext) {
  const snapshot = await getOperationsSnapshot(userContext);

  return {
    zones: snapshot.zones,
    volunteers: snapshot.volunteers,
    incidents: snapshot.incidents,
  };
}

export async function getAnalyticsData(userContext) {
  const snapshot = await getOperationsSnapshot(userContext);

  return {
    hourlyLoad: snapshot.hourlyLoad,
    zonePerformance: snapshot.zonePerformance,
    volunteers: snapshot.volunteers,
    zones: snapshot.zones,
  };
}
