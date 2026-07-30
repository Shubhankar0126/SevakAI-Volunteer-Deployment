import { isApiError } from "../utils/api-error.js";
import { logger } from "../utils/logger.js";

const errorLogger = logger.child({ component: "errors" });

export function notFoundHandler(request, response) {
  response.status(404).json({
    success: false,
    message: `Route not found: ${request.method} ${request.originalUrl}`,
  });
}

export function errorHandler(error, request, response, _next) {
  if (isApiError(error)) {
    errorLogger.warn("Handled application error.", {
      method: request.method,
      path: request.originalUrl,
      statusCode: error.statusCode,
      details: error.details ?? null,
    });

    response.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.details ?? null,
    });
    return;
  }

  errorLogger.error("Unhandled server error.", {
    method: request.method,
    path: request.originalUrl,
    error,
  });

  response.status(500).json({
    success: false,
    message: "Internal server error.",
  });
}
