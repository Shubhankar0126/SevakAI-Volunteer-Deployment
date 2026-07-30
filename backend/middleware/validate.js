import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

function formatZodError(error) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

export function validate(schemas) {
  return asyncHandler(async (request, _response, next) => {
    for (const [section, schema] of Object.entries(schemas)) {
      if (!schema) {
        continue;
      }

      const result = await schema.safeParseAsync(request[section]);
      if (!result.success) {
        throw new ApiError(400, "Validation failed.", formatZodError(result.error));
      }

      request[section] = result.data;
    }

    next();
  });
}
