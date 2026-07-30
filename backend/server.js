import http from "node:http";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { initializeDataStore } from "./services/data-store.service.js";
import { initializeSocket } from "./socket/index.js";
import { logger } from "./utils/logger.js";

const serverLogger = logger.child({ component: "server" });

const app = createApp();
const server = http.createServer(app);

async function shutdown(signal) {
  serverLogger.info("Received shutdown signal.", { signal });

  server.close(async () => {
    try {
      await disconnectDatabase();
    } finally {
      process.exit(0);
    }
  });
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
process.on("unhandledRejection", (error) => {
  serverLogger.error("Unhandled promise rejection.", { error });
});
process.on("uncaughtException", (error) => {
  serverLogger.error("Uncaught exception.", { error });
  process.exit(1);
});

try {
  await connectDatabase();
  await initializeDataStore();
  initializeSocket(server);

  server.listen(env.port, () => {
    serverLogger.info("SevakAI backend listening.", { port: env.port });
  });
} catch (error) {
  serverLogger.error("Failed to start SevakAI backend.", { error });
  await disconnectDatabase().catch(() => {});
  process.exit(1);
}
