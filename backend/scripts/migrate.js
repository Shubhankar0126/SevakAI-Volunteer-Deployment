import { connectDatabase, disconnectDatabase } from "../config/db.js";
import {
  ActivityLog,
  Analytics,
  Assignment,
  Attendance,
  AuditLog,
  Chat,
  Forecast,
  Incident,
  Message,
  Notification,
  Profile,
  Role,
  SystemLog,
  Task,
  User,
  Volunteer,
  Zone,
  ZoneManager,
} from "../models/index.js";
import { logger } from "../utils/logger.js";

const migrateLogger = logger.child({ component: "migrate" });
const MODELS = [
  User,
  Profile,
  Role,
  Volunteer,
  ZoneManager,
  Zone,
  Incident,
  Assignment,
  Task,
  Attendance,
  Analytics,
  Forecast,
  Notification,
  Chat,
  Message,
  ActivityLog,
  SystemLog,
  AuditLog,
];

async function syncIndexes() {
  for (const model of MODELS) {
    await model.syncIndexes();
    migrateLogger.info("Indexes synchronized.", { model: model.modelName });
  }
}

async function backfillDocuments() {
  await User.updateMany(
    {},
    {
      $set: {
        isActive: true,
      },
      $setOnInsert: {
        failedLoginAttempts: 0,
      },
    },
  );

  await User.updateMany(
    { failedLoginAttempts: { $exists: false } },
    { $set: { failedLoginAttempts: 0 } },
  );
  await User.updateMany({ passwordReset: { $exists: false } }, { $set: { passwordReset: null } });
  await User.updateMany(
    { lastPasswordChangedAt: { $exists: false } },
    { $set: { lastPasswordChangedAt: null } },
  );
}

try {
  await connectDatabase();
  await backfillDocuments();
  await syncIndexes();
  migrateLogger.info("Database migration completed.");
} catch (error) {
  migrateLogger.error("Database migration failed.", { error });
  process.exitCode = 1;
} finally {
  await disconnectDatabase().catch(() => {});
}
