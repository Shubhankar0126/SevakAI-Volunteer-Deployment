import { Server } from "socket.io";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

let io;
const socketLogger = logger.child({ component: "socket" });
const connections = new Map();

function trackSocket(socket, payload = {}) {
  const next = {
    socketId: socket.id,
    userId: payload.userId ?? null,
    role: payload.role ?? null,
    zoneId: payload.zoneId ?? null,
    connectedAt: new Date().toISOString(),
  };

  connections.set(socket.id, next);
  return next;
}

function forgetSocket(socketId) {
  connections.delete(socketId);
}

export function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: env.clientUrls,
      credentials: true,
    },
    transports: ["websocket", "polling"],
    serveClient: false,
  });

  io.on("connection", (socket) => {
    socketLogger.info("Socket connected.", { socketId: socket.id });
    trackSocket(socket);

    socket.on("presence:join", (payload = {}) => {
      const tracked = trackSocket(socket, payload);

      if (payload.role) {
        socket.join(`role:${payload.role}`);
      }

      if (payload.zoneId) {
        socket.join(`zone:${payload.zoneId}`);
      }

      if (payload.userId) {
        socket.join(`user:${payload.userId}`);
      }

      socketLogger.debug("Socket presence joined.", tracked);
    });

    socket.on("disconnect", (reason) => {
      socketLogger.info("Socket disconnected.", {
        socketId: socket.id,
        reason,
      });
      forgetSocket(socket.id);
    });

    socket.on("error", (error) => {
      socketLogger.warn("Socket error.", {
        socketId: socket.id,
        error,
      });
    });
  });

  return io;
}

export function emitOperationsUpdated(payload = {}) {
  io?.emit("operations:updated", {
    timestamp: new Date().toISOString(),
    ...payload,
  });
}

export function emitNotificationUpdated(payload = {}) {
  io?.emit("notifications:updated", {
    timestamp: new Date().toISOString(),
    ...payload,
  });
}

export function emitMessageCreated(payload = {}) {
  io?.emit("messages:updated", {
    timestamp: new Date().toISOString(),
    ...payload,
  });
}

export function getSocketHealth() {
  return {
    initialized: Boolean(io),
    connectionCount: connections.size,
  };
}
