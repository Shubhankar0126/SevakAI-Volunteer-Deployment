import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApiError } from "../utils/api-error.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { getOperationsSnapshot } from "./data-store.service.js";

const MODEL_RETRY_STATUSES = new Set([429, 500, 503]);
const geminiLogger = logger.child({ component: "gemini" });

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function formatIncident(incident) {
  return `${incident.incidentCode} (${incident.type.replaceAll("_", " ")}) in ${incident.zone}`;
}

function buildFallbackAnswer(snapshot) {
  const criticalIncidents = snapshot.incidents.filter(
    (incident) => incident.severity === "critical",
  );
  const urgentIncidents = snapshot.incidents.filter(
    (incident) =>
      incident.status !== "resolved" &&
      (incident.severity === "critical" || incident.severity === "high"),
  );
  const overloadedZones = snapshot.zones
    .filter((zone) => zone.density >= 80)
    .sort((left, right) => right.density - left.density)
    .slice(0, 2);
  const highestRiskForecast = snapshot.forecasts.find((forecast) => forecast.risk === "high");

  const summary = [];
  summary.push(
    "Gemini is temporarily unavailable, so this is a rules-based operations summary from the live snapshot.",
  );

  if (criticalIncidents.length > 0) {
    summary.push(
      `Top priority: ${criticalIncidents.map((incident) => formatIncident(incident)).join(", ")}.`,
    );
  } else if (urgentIncidents.length > 0) {
    summary.push(`Top priority: ${formatIncident(urgentIncidents[0])} requires attention next.`);
  } else {
    summary.push("No critical incidents are active right now.");
  }

  if (overloadedZones.length > 0) {
    summary.push(
      `Crowd pressure is highest in ${overloadedZones
        .map((zone) => `${zone.name} (${zone.density}% density)`)
        .join(" and ")}.`,
    );
  }

  summary.push(
    `${snapshot.stats.availableVolunteers} volunteers are currently available out of ${snapshot.volunteers.length}, with average performance at ${snapshot.stats.averagePerformance}.`,
  );

  if (highestRiskForecast) {
    summary.push(
      `Next expected surge: ${highestRiskForecast.zone} in ${highestRiskForecast.in}, with forecasted need ${highestRiskForecast.need}.`,
    );
  }

  summary.push(
    "Recommended action: keep dispatch focused on open high-severity incidents and pre-stage backup coverage in the highest-density zones.",
  );

  return summary.join(" ");
}

async function generateAssistantAnswer(model, prompt) {
  const result = await Promise.race([
    model.generateContent(prompt),
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new ApiError(504, "Gemini request timed out."));
      }, env.geminiTimeoutMs);
    }),
  ]);
  return result.response.text();
}

export async function askOperationsAssistant(question, userContext) {
  if (!env.geminiApiKey) {
    throw new ApiError(503, "Gemini API key is not configured.");
  }

  const snapshot = await getOperationsSnapshot(userContext);
  const genAI = new GoogleGenerativeAI(env.geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: env.geminiModel,
  });

  const groundedContext = JSON.stringify(
    {
      stats: snapshot.stats,
      zones: snapshot.zones.map((zone) => ({
        name: zone.name,
        density: zone.density,
        active: zone.active,
        capacity: zone.capacity,
      })),
      incidents: snapshot.incidents.map((incident) => ({
        code: incident.incidentCode,
        type: incident.type,
        zone: incident.zone,
        severity: incident.severity,
        status: incident.status,
        note: incident.note,
      })),
      forecasts: snapshot.forecasts,
      volunteerSummary: {
        total: snapshot.volunteers.length,
        available: snapshot.volunteers.filter((volunteer) => volunteer.status === "available")
          .length,
        busy: snapshot.volunteers.filter((volunteer) => volunteer.status === "busy").length,
        averageFatigue: Math.round(
          snapshot.volunteers.reduce((total, volunteer) => total + volunteer.fatigue, 0) /
            snapshot.volunteers.length,
        ),
      },
    },
    null,
    2,
  );

  const prompt = `
You are SevakAI, an operations assistant for a large volunteer deployment platform.
Answer only from the provided operational snapshot.
If a detail is missing, say that it is not available in the current snapshot.
Give direct, practical recommendations.

Operational snapshot:
${groundedContext}

User question:
${question}
`;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const answer = await generateAssistantAnswer(model, prompt);
      return {
        answer,
        source: "gemini",
        fallback: false,
      };
    } catch (error) {
      const status = error?.status;
      const shouldRetry = MODEL_RETRY_STATUSES.has(status) && attempt < 2;

      if (shouldRetry) {
        await sleep(500 * (attempt + 1));
        continue;
      }

      if (MODEL_RETRY_STATUSES.has(status)) {
        geminiLogger.warn("Gemini unavailable. Falling back to deterministic response.", {
          status,
        });
        return {
          answer: buildFallbackAnswer(snapshot),
          source: "fallback",
          fallback: true,
        };
      }

      geminiLogger.error("Gemini request failed.", { error });

      throw error;
    }
  }

  return {
    answer: buildFallbackAnswer(snapshot),
    source: "fallback",
    fallback: true,
  };
}
