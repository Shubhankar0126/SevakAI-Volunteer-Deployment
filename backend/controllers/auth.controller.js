import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess } from "../utils/response.js";
import {
  applyAuthCookies,
  clearSessionCookies,
  loginAccount,
  logoutAccount,
  requestPasswordReset,
  resetPassword as resetPasswordService,
  refreshAccount,
  registerAccount,
} from "../services/auth.service.js";

export const register = asyncHandler(async (request, response) => {
  const session = await registerAccount(request.body);
  applyAuthCookies(response, session);
  sendSuccess(response, session.auth, "Account created successfully.", 201);
});

export const login = asyncHandler(async (request, response) => {
  const session = await loginAccount(request.body);
  applyAuthCookies(response, session);
  sendSuccess(response, session.auth, "Signed in successfully.");
});

export const refresh = asyncHandler(async (request, response) => {
  const session = await refreshAccount(request.cookies?.sevakai_refresh);
  applyAuthCookies(response, session);
  sendSuccess(response, session.auth, "Session refreshed.");
});

export const me = asyncHandler(async (request, response) => {
  sendSuccess(response, {
    user: request.auth.user,
    role: request.auth.role,
    profile: request.auth.profile,
    volunteer: request.auth.volunteer,
    zoneManager: request.auth.zoneManager,
  });
});

export const logout = asyncHandler(async (request, response) => {
  await logoutAccount(request.auth.user.id);
  clearSessionCookies(response);
  sendSuccess(response, { ok: true }, "Signed out successfully.");
});

export const forgotPassword = asyncHandler(async (request, response) => {
  sendSuccess(
    response,
    await requestPasswordReset(request.body.email),
    "Password reset request accepted.",
  );
});

export const resetPassword = asyncHandler(async (request, response) => {
  sendSuccess(
    response,
    await resetPasswordService(request.body.token, request.body.password),
    "Password reset successfully.",
  );
});
