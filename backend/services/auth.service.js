import bcrypt from "bcryptjs";
import { ApiError } from "../utils/api-error.js";
import { env } from "../config/env.js";
import {
  clearAuthCookies,
  hashToken,
  setAuthCookies,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { logger } from "../utils/logger.js";
import {
  clearFailedLoginAttempts,
  clearPasswordResetToken,
  clearUserRefreshToken,
  createActivityLogEntry,
  createAuditLogEntry,
  createSystemLogEntry,
  createUserBundle,
  findUserByEmail,
  findUserById,
  findUserByPasswordResetToken,
  getUserContextById,
  issuePasswordResetToken,
  recordFailedLoginAttempt,
  setPasswordResetToken,
  setUserRefreshToken,
  updateUserPassword,
} from "./data-store.service.js";

const authLogger = logger.child({ component: "auth" });

function buildTokenPayload(userContext) {
  return {
    sub: userContext.user.id,
    email: userContext.user.email,
    role: userContext.role,
  };
}

function buildAuthPayload(userContext) {
  return {
    user: {
      id: userContext.user.id,
      email: userContext.user.email,
      fullName: userContext.user.fullName,
      phone: userContext.user.phone,
      role: userContext.role,
      avatarUrl: userContext.user.avatarUrl ?? "",
    },
    role: userContext.role,
    profile: userContext.profile,
    volunteer: userContext.volunteer,
    zoneManager: userContext.zoneManager,
  };
}

function isLocked(user) {
  return Boolean(user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now());
}

async function persistRefreshToken(userContext, refreshToken) {
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await setUserRefreshToken(userContext.user.id, refreshTokenHash, expiresAt);
}

export async function registerAccount(payload) {
  const existing = await findUserByEmail(payload.email);
  if (existing) {
    throw new ApiError(409, "An account already exists for that email address.");
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const userContext = await createUserBundle({
    email: payload.email,
    passwordHash,
    fullName: payload.fullName,
    phone: payload.phone || "",
    role: payload.role,
  });

  const accessToken = signAccessToken(buildTokenPayload(userContext));
  const refreshToken = signRefreshToken(buildTokenPayload(userContext));
  await persistRefreshToken(userContext, refreshToken);
  await createActivityLogEntry({
    userId: userContext.user.id,
    action: "account_registered",
    entityType: "user",
    entityId: userContext.user.id,
    meta: { role: userContext.role },
  });
  await createAuditLogEntry({
    actorUserId: userContext.user.id,
    action: "account_registered",
    entityType: "user",
    entityId: userContext.user.id,
    after: { email: userContext.user.email, role: userContext.role },
  });

  return {
    accessToken,
    refreshToken,
    auth: buildAuthPayload(userContext),
  };
}

export async function loginAccount(payload) {
  const user = await findUserByEmail(payload.email);
  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Account is disabled.");
  }

  if (isLocked(user)) {
    throw new ApiError(423, "Account is temporarily locked. Try again later.");
  }

  const passwordMatches = await bcrypt.compare(payload.password, user.passwordHash);
  if (!passwordMatches) {
    const outcome = await recordFailedLoginAttempt(
      user.id,
      env.maxLoginAttempts,
      env.accountLockMs,
    );

    await createSystemLogEntry({
      level: "warn",
      source: "auth",
      message: "Authentication failure recorded.",
      meta: {
        userId: user.id,
        failedLoginAttempts: outcome?.failedLoginAttempts ?? null,
        lockedUntil: outcome?.lockedUntil ?? null,
      },
    });

    throw new ApiError(401, "Invalid email or password.");
  }

  await clearFailedLoginAttempts(user.id);

  const userContext = await getUserContextById(user.id);
  const accessToken = signAccessToken(buildTokenPayload(userContext));
  const refreshToken = signRefreshToken(buildTokenPayload(userContext));
  await persistRefreshToken(userContext, refreshToken);
  await createActivityLogEntry({
    userId: userContext.user.id,
    action: "account_logged_in",
    entityType: "user",
    entityId: userContext.user.id,
    meta: { role: userContext.role },
  });
  await createAuditLogEntry({
    actorUserId: userContext.user.id,
    action: "account_logged_in",
    entityType: "user",
    entityId: userContext.user.id,
    after: { role: userContext.role, lastLoginAt: new Date().toISOString() },
  });

  return {
    accessToken,
    refreshToken,
    auth: buildAuthPayload(userContext),
  };
}

export async function refreshAccount(refreshToken) {
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token missing.");
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, "Refresh token invalid or expired.");
  }

  const [rawUser, userContext] = await Promise.all([
    findUserById(payload.sub),
    getUserContextById(payload.sub),
  ]);

  if (!rawUser || !userContext?.user) {
    throw new ApiError(401, "Session no longer exists.");
  }

  const tokenHash = hashToken(refreshToken);
  if (!rawUser.refreshToken || rawUser.refreshToken.tokenHash !== tokenHash) {
    throw new ApiError(401, "Refresh token is no longer valid.");
  }

  if (new Date(rawUser.refreshToken.expiresAt).getTime() <= Date.now()) {
    throw new ApiError(401, "Refresh token invalid or expired.");
  }

  const accessToken = signAccessToken(buildTokenPayload(userContext));
  const nextRefreshToken = signRefreshToken(buildTokenPayload(userContext));
  await persistRefreshToken(userContext, nextRefreshToken);

  return {
    accessToken,
    refreshToken: nextRefreshToken,
    auth: buildAuthPayload(userContext),
  };
}

export async function logoutAccount(userId) {
  await clearUserRefreshToken(userId);
  await createSystemLogEntry({
    level: "info",
    source: "auth",
    message: "User logged out successfully.",
    meta: { userId },
  });
}

export async function requestPasswordReset(email) {
  const user = await findUserByEmail(email);
  if (!user) {
    return {
      accepted: true,
      message: "If an account exists for that email, a password reset request has been created.",
    };
  }

  const token = issuePasswordResetToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await setPasswordResetToken(user.id, tokenHash, expiresAt);
  await createSystemLogEntry({
    level: "info",
    source: "auth",
    message: "Password reset requested.",
    meta: {
      userId: user.id,
      expiresAt: expiresAt.toISOString(),
    },
  });

  if (env.nodeEnv !== "production") {
    authLogger.warn("Password reset token generated for local development.", {
      userId: user.id,
      resetToken: token,
    });
  }

  return {
    accepted: true,
    message: "If an account exists for that email, a password reset request has been created.",
  };
}

export async function resetPassword(token, newPassword) {
  const tokenHash = hashToken(token);
  const user = await findUserByPasswordResetToken(tokenHash);

  if (!user || !user.passwordReset) {
    throw new ApiError(400, "Password reset token is invalid.");
  }

  if (new Date(user.passwordReset.expiresAt).getTime() <= Date.now()) {
    await clearPasswordResetToken(user.id);
    throw new ApiError(400, "Password reset token has expired.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await updateUserPassword(user.id, passwordHash);
  await clearUserRefreshToken(user.id);
  await createAuditLogEntry({
    actorUserId: user.id,
    action: "password_reset_completed",
    entityType: "user",
    entityId: user.id,
    after: { passwordChangedAt: new Date().toISOString() },
  });

  return {
    ok: true,
  };
}

export function applyAuthCookies(response, session) {
  setAuthCookies(response, session.accessToken, session.refreshToken);
}

export function clearSessionCookies(response) {
  clearAuthCookies(response);
}
