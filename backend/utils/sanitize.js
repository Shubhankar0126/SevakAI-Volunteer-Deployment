function sanitizeString(value) {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\0/g, "")
    .trim();
}

function sanitizeValue(value) {
  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry));
  }

  if (value && typeof value === "object") {
    const next = {};
    for (const [key, entry] of Object.entries(value)) {
      if (key.startsWith("$") || key.includes(".")) {
        continue;
      }
      next[key] = sanitizeValue(entry);
    }
    return next;
  }

  return value;
}

function mutateTarget(target, sanitized) {
  if (!target || typeof target !== "object" || Array.isArray(target)) {
    return;
  }

  for (const key of Object.keys(target)) {
    if (!(key in sanitized)) {
      delete target[key];
    }
  }

  for (const [key, value] of Object.entries(sanitized)) {
    target[key] = value;
  }
}

export function sanitizeRequestPayload(request, _response, next) {
  if (request.body) {
    request.body = sanitizeValue(request.body);
  }

  if (request.query) {
    mutateTarget(request.query, sanitizeValue(request.query));
  }

  next();
}
