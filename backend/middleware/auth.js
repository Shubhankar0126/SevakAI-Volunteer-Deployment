import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { getUserContextById } from "../services/data-store.service.js";

function extractAccessToken(request) {
  const bearerToken = request.headers.authorization?.startsWith("Bearer ")
    ? request.headers.authorization.slice(7)
    : null;

  return request.cookies?.sevakai_access ?? bearerToken;
}

export const requireAuth = asyncHandler(async (request, _response, next) => {
  const token = extractAccessToken(request);
  if (!token) {
    throw new ApiError(401, "Authentication required.");
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new ApiError(401, "Session expired. Please sign in again.");
  }

  const userContext = await getUserContextById(payload.sub);
  if (!userContext) {
    throw new ApiError(401, "Session no longer exists.");
  }

  request.auth = userContext;
  next();
});

export function requireRole(...roles) {
  return function checkRole(request, _response, next) {
    if (!request.auth || !roles.includes(request.auth.role)) {
      next(new ApiError(403, "You do not have access to this resource."));
      return;
    }

    next();
  };
}
