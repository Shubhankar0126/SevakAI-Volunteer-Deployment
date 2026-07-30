import test from "node:test";
import assert from "node:assert/strict";

const requiredEnv = [
  "MONGODB_URI",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "GEMINI_API_KEY",
  "TEST_ADMIN_EMAIL",
  "TEST_ADMIN_PASSWORD",
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);

test(
  "backend smoke suite prerequisites",
  { skip: missingEnv.length > 0 ? "Missing runtime test environment variables." : false },
  async () => {
    process.env.NODE_ENV = process.env.NODE_ENV || "test";
    process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

    const http = await import("node:http");
    const { createApp } = await import("../app.js");
    const { connectDatabase, disconnectDatabase } = await import("../config/db.js");
    const { initializeDataStore } = await import("../services/data-store.service.js");

    const app = createApp();
    const server = http.createServer(app);

    try {
      await connectDatabase();
      await initializeDataStore();
      await new Promise((resolve) => server.listen(0, resolve));
      const address = server.address();
      assert.ok(address && typeof address === "object");
      const baseUrl = `http://127.0.0.1:${address.port}`;

      const healthResponse = await fetch(`${baseUrl}/api/health`);
      assert.equal(healthResponse.status, 200);

      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: process.env.TEST_ADMIN_EMAIL,
          password: process.env.TEST_ADMIN_PASSWORD,
        }),
      });
      assert.equal(loginResponse.status, 200);
    } finally {
      await new Promise((resolve) => server.close(resolve));
      await disconnectDatabase();
    }
  },
);
