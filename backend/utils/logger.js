import { env } from "../config/env.js";

const LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const minimumLevel = env.nodeEnv === "production" ? LEVELS.info : LEVELS.debug;

function serializeError(error) {
  if (!error) {
    return undefined;
  }

  return {
    name: error.name,
    message: error.message,
    stack: env.nodeEnv === "production" ? undefined : error.stack,
  };
}

function normalizeMeta(meta) {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
    return meta;
  }

  const next = {};
  for (const [key, value] of Object.entries(meta)) {
    if (value instanceof Error) {
      next[key] = serializeError(value);
      continue;
    }

    next[key] = value;
  }
  return next;
}

function write(level, message, meta = {}) {
  if ((LEVELS[level] ?? LEVELS.info) < minimumLevel) {
    return;
  }

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...normalizeMeta(meta),
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  debug(message, meta) {
    write("debug", message, meta);
  },
  info(message, meta) {
    write("info", message, meta);
  },
  warn(message, meta) {
    write("warn", message, meta);
  },
  error(message, meta) {
    write("error", message, meta);
  },
  child(bindings = {}) {
    return {
      debug(message, meta) {
        write("debug", message, { ...bindings, ...(meta ?? {}) });
      },
      info(message, meta) {
        write("info", message, { ...bindings, ...(meta ?? {}) });
      },
      warn(message, meta) {
        write("warn", message, { ...bindings, ...(meta ?? {}) });
      },
      error(message, meta) {
        write("error", message, { ...bindings, ...(meta ?? {}) });
      },
    };
  },
};
