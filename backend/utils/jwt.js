import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const DURATION_MULTIPLIERS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

function durationToMs(value, fallbackMs) {
  if (typeof value === "number") {
    return value * 1000;
  }

  const match = String(value)
    .trim()
    .match(/^(\d+)([smhd])$/i);
  if (!match) {
    return fallbackMs;
  }

  return Number(match[1]) * DURATION_MULTIPLIERS[match[2].toLowerCase()];
}

export function signAccessToken(payload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function buildCookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: env.nodeEnv === "production" ? "none" : "lax",
    path: "/",
    maxAge,
    domain: env.cookieDomain || undefined,
  };
}

export function setAuthCookies(response, accessToken, refreshToken) {
  response.cookie(
    "sevakai_access",
    accessToken,
    buildCookieOptions(durationToMs(env.jwtExpiresIn, 15 * 60 * 1000)),
  );
  response.cookie(
    "sevakai_refresh",
    refreshToken,
    buildCookieOptions(durationToMs(env.jwtRefreshExpiresIn, 7 * 24 * 60 * 60 * 1000)),
  );
}

export function clearAuthCookies(response) {
  response.clearCookie("sevakai_access", buildCookieOptions(0));
  response.clearCookie("sevakai_refresh", buildCookieOptions(0));
}
