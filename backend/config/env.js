import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: z.string().trim().min(1, "MONGODB_URI is required."),
  JWT_SECRET: z.string().trim().min(1, "JWT_SECRET is required."),
  JWT_REFRESH_SECRET: z.string().trim().min(1, "JWT_REFRESH_SECRET is required."),
  JWT_EXPIRES_IN: z.string().trim().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().trim().default("7d"),
  GEMINI_API_KEY: z.string().trim().min(1, "GEMINI_API_KEY is required."),
  GEMINI_MODEL: z.string().trim().default("gemini-3.6-flash"),
  GEMINI_TIMEOUT_MS: z.coerce.number().int().min(1000).default(15000),
  CLIENT_URL: z.string().trim().min(1, "CLIENT_URL is required."),
  COOKIE_DOMAIN: z.string().trim().optional().default(""),
  CLOUDINARY_CLOUD_NAME: z.string().trim().optional().default(""),
  CLOUDINARY_API_KEY: z.string().trim().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().trim().optional().default(""),
  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(250),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(20),
  MAX_LOGIN_ATTEMPTS: z.coerce.number().int().min(3).default(5),
  ACCOUNT_LOCK_MS: z.coerce
    .number()
    .int()
    .min(60000)
    .default(15 * 60 * 1000),
  DB_MAX_POOL_SIZE: z.coerce.number().int().min(1).default(20),
  DB_MIN_POOL_SIZE: z.coerce.number().int().min(0).default(2),
  DB_CONNECT_RETRIES: z.coerce.number().int().min(1).default(5),
  DB_RETRY_DELAY_MS: z.coerce.number().int().min(250).default(1500),
  DB_SERVER_SELECTION_TIMEOUT_MS: z.coerce.number().int().min(1000).default(10000),
  DB_SOCKET_TIMEOUT_MS: z.coerce.number().int().min(1000).default(45000),
  DB_MAX_IDLE_TIME_MS: z.coerce.number().int().min(1000).default(60000),
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  const details = parsedEnvironment.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid environment configuration. ${details}`);
}

const values = parsedEnvironment.data;
const clientUrls = values.CLIENT_URL.split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);

export const env = {
  nodeEnv: values.NODE_ENV,
  port: values.PORT,
  mongodbUri: values.MONGODB_URI,
  jwtSecret: values.JWT_SECRET,
  jwtRefreshSecret: values.JWT_REFRESH_SECRET,
  jwtExpiresIn: values.JWT_EXPIRES_IN,
  jwtRefreshExpiresIn: values.JWT_REFRESH_EXPIRES_IN,
  geminiApiKey: values.GEMINI_API_KEY,
  geminiModel: values.GEMINI_MODEL,
  geminiTimeoutMs: values.GEMINI_TIMEOUT_MS,
  clientUrl: values.CLIENT_URL,
  clientUrls,
  cookieDomain: values.COOKIE_DOMAIN,
  cloudinaryCloudName: values.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: values.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: values.CLOUDINARY_API_SECRET,
  rateLimitWindowMs: values.RATE_LIMIT_WINDOW_MS,
  rateLimitMax: values.RATE_LIMIT_MAX,
  authRateLimitMax: values.AUTH_RATE_LIMIT_MAX,
  maxLoginAttempts: values.MAX_LOGIN_ATTEMPTS,
  accountLockMs: values.ACCOUNT_LOCK_MS,
  dbMaxPoolSize: values.DB_MAX_POOL_SIZE,
  dbMinPoolSize: values.DB_MIN_POOL_SIZE,
  dbConnectRetries: values.DB_CONNECT_RETRIES,
  dbRetryDelayMs: values.DB_RETRY_DELAY_MS,
  dbServerSelectionTimeoutMs: values.DB_SERVER_SELECTION_TIMEOUT_MS,
  dbSocketTimeoutMs: values.DB_SOCKET_TIMEOUT_MS,
  dbMaxIdleTimeMs: values.DB_MAX_IDLE_TIME_MS,
};

export const features = {
  cloudinary: Boolean(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret),
};
