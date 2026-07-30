import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import apiRoutes from "./routes/index.js";
import { getDatabaseHealth } from "./config/db.js";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { sanitizeRequestPayload } from "./utils/sanitize.js";
import { logger } from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requestLogger = logger.child({ component: "http" });

function buildRateLimit(max) {
  return rateLimit({
    windowMs: env.rateLimitWindowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler(_request, response) {
      response.status(429).json({
        success: false,
        message: "Too many requests. Please slow down and try again shortly.",
      });
    },
  });
}

function morganStream() {
  return {
    write(message) {
      requestLogger.info(message.trim());
    },
  };
}

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      referrerPolicy: { policy: "no-referrer" },
    }),
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.clientUrls.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Origin not allowed by CORS."));
      },
      credentials: true,
    }),
  );
  app.use(buildRateLimit(env.rateLimitMax));
  app.use(compression());
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev", { stream: morganStream() }));
  app.use(cookieParser());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));
  app.use(sanitizeRequestPayload);
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  app.get("/api/health", (_request, response) => {
    response.json({
      success: true,
      message: "SevakAI API healthy.",
      data: {
        time: new Date().toISOString(),
        database: getDatabaseHealth(),
      },
    });
  });

  app.use("/api", apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
