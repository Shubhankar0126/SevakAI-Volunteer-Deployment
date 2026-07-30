import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

mongoose.set("strictQuery", true);

const databaseLogger = logger.child({ component: "database" });

const connectionState = {
  connectedAt: null,
  lastError: null,
  lastErrorAt: null,
  lastDisconnectAt: null,
  reconnectAttempts: 0,
};

let connectPromise = null;
let listenersBound = false;

function bindConnectionListeners() {
  if (listenersBound) {
    return;
  }

  mongoose.connection.on("connected", () => {
    connectionState.connectedAt = new Date().toISOString();
    connectionState.lastError = null;
    databaseLogger.info("MongoDB connection established.");
  });

  mongoose.connection.on("disconnected", () => {
    connectionState.lastDisconnectAt = new Date().toISOString();
    databaseLogger.warn("MongoDB connection lost.");
  });

  mongoose.connection.on("reconnected", () => {
    connectionState.connectedAt = new Date().toISOString();
    databaseLogger.info("MongoDB connection re-established.");
  });

  mongoose.connection.on("error", (error) => {
    connectionState.lastError = error.message;
    connectionState.lastErrorAt = new Date().toISOString();
    databaseLogger.error("MongoDB connection error.", { error });
  });

  listenersBound = true;
}

async function attemptConnection() {
  bindConnectionListeners();

  for (let attempt = 1; attempt <= env.dbConnectRetries; attempt += 1) {
    try {
      connectionState.reconnectAttempts = attempt - 1;
      await mongoose.connect(env.mongodbUri, {
        maxPoolSize: env.dbMaxPoolSize,
        minPoolSize: env.dbMinPoolSize,
        serverSelectionTimeoutMS: env.dbServerSelectionTimeoutMs,
        socketTimeoutMS: env.dbSocketTimeoutMs,
        maxIdleTimeMS: env.dbMaxIdleTimeMs,
        autoIndex: env.nodeEnv !== "production",
      });
      return mongoose.connection;
    } catch (error) {
      connectionState.lastError = error.message;
      connectionState.lastErrorAt = new Date().toISOString();
      connectionState.reconnectAttempts = attempt;

      databaseLogger.warn("MongoDB connection attempt failed.", {
        attempt,
        maxAttempts: env.dbConnectRetries,
        error,
      });

      if (attempt === env.dbConnectRetries) {
        throw error;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, env.dbRetryDelayMs * attempt);
      });
    }
  }

  return mongoose.connection;
}

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectPromise) {
    connectPromise = attemptConnection().finally(() => {
      connectPromise = null;
    });
  }

  return connectPromise;
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
}

export function getDatabaseHealth() {
  return {
    state: mongoose.connection.readyState,
    ready: mongoose.connection.readyState === 1,
    connectedAt: connectionState.connectedAt,
    lastDisconnectAt: connectionState.lastDisconnectAt,
    lastError: connectionState.lastError,
    lastErrorAt: connectionState.lastErrorAt,
    reconnectAttempts: connectionState.reconnectAttempts,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
}
