import bcrypt from "bcryptjs";
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
import { DEFAULT_USERS } from "../utils/constants.js";
import {
  buildForecasts,
  buildHourlyLoad,
  buildIncidentBlueprints,
  buildVolunteerBlueprints,
  buildZonePerformance,
  buildZones,
  rankVolunteersForIncident,
} from "../utils/operations.js";
import { logger } from "../utils/logger.js";

const seedLogger = logger.child({ component: "seed" });
const shouldReset = process.argv.includes("--fresh");

function sameId(left, right) {
  return String(left) === String(right);
}

async function resetCollections() {
  await Promise.all([
    ActivityLog.deleteMany({}),
    Analytics.deleteMany({}),
    Assignment.deleteMany({}),
    Attendance.deleteMany({}),
    AuditLog.deleteMany({}),
    Chat.deleteMany({}),
    Forecast.deleteMany({}),
    Incident.deleteMany({}),
    Message.deleteMany({}),
    Notification.deleteMany({}),
    Profile.deleteMany({}),
    Role.deleteMany({}),
    SystemLog.deleteMany({}),
    Task.deleteMany({}),
    User.deleteMany({}),
    Volunteer.deleteMany({}),
    Zone.deleteMany({}),
    ZoneManager.deleteMany({}),
  ]);
}

async function seedDatabase() {
  if (shouldReset) {
    seedLogger.warn("Resetting database before seeding.");
    await resetCollections();
  }

  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) {
    seedLogger.info("Database already contains users. Skipping seed.");
    return;
  }

  const zones = await Zone.insertMany(
    buildZones().map((zone) => ({
      zoneCode: zone.id,
      name: zone.name,
      density: zone.density,
      active: zone.active,
      capacity: zone.capacity,
      x: zone.x,
      y: zone.y,
      status: zone.status,
    })),
  );

  await Forecast.insertMany(buildForecasts());
  await Analytics.insertMany([
    { metricType: "hourlyLoad", payload: buildHourlyLoad() },
    {
      metricType: "zonePerformance",
      payload: buildZonePerformance(
        zones.map((zone) => ({
          id: zone.zoneCode,
          name: zone.name,
          density: zone.density,
          active: zone.active,
          capacity: zone.capacity,
          x: zone.x,
          y: zone.y,
        })),
      ),
    },
  ]);

  const volunteerBlueprints = buildVolunteerBlueprints();
  const usedBlueprintCodes = new Set();

  for (const seedUser of DEFAULT_USERS) {
    const zone = zones.find((item) => sameId(item.zoneCode, seedUser.zoneId)) ?? zones[0];
    const passwordHash = await bcrypt.hash(seedUser.password, 12);
    const user = await User.create({
      email: seedUser.email,
      passwordHash,
      role: seedUser.role,
      fullName: seedUser.fullName,
      phone: seedUser.phone,
      isActive: true,
    });

    const profile = await Profile.create({
      userId: user._id,
      fullName: seedUser.fullName,
      phone: seedUser.phone,
      zoneId: zone.zoneCode,
      zone: zone.name,
      languages: ["Hindi", "English"],
      skills: seedUser.role === "volunteer" ? ["medical", "crowd"] : ["security", "crowd"],
    });
    await Role.create({
      userId: user._id,
      name: seedUser.role,
    });

    user.profileId = profile._id;

    if (seedUser.role === "volunteer") {
      const preferredBlueprint =
        volunteerBlueprints.find(
          (blueprint) =>
            blueprint.name === seedUser.fullName && sameId(blueprint.zoneId, seedUser.zoneId),
        ) ?? volunteerBlueprints.find((blueprint) => sameId(blueprint.zoneId, seedUser.zoneId));

      const volunteerBlueprint = preferredBlueprint ?? volunteerBlueprints[0];
      usedBlueprintCodes.add(volunteerBlueprint.volunteerCode);

      const volunteer = await Volunteer.create({
        userId: user._id,
        volunteerCode: volunteerBlueprint.volunteerCode,
        name: seedUser.fullName,
        zoneId: volunteerBlueprint.zoneId,
        zone: volunteerBlueprint.zone,
        skills: volunteerBlueprint.skills,
        languages: volunteerBlueprint.languages,
        performance: volunteerBlueprint.performance,
        fatigue: volunteerBlueprint.fatigue,
        hoursToday: volunteerBlueprint.hoursToday,
        status: volunteerBlueprint.status,
        x: volunteerBlueprint.x,
        y: volunteerBlueprint.y,
        phone: seedUser.phone,
      });
      user.volunteerId = volunteer._id;

      await Attendance.create({
        userId: user._id,
        volunteerId: volunteer._id,
        date: new Date().toISOString().slice(0, 10),
        shiftStart: "06:00",
        shiftEnd: "18:00",
        hoursWorked: volunteer.hoursToday,
        status: "checked_in",
      });
    }

    if (seedUser.role === "zone_manager") {
      const zoneManager = await ZoneManager.create({
        userId: user._id,
        zoneId: zone.zoneCode,
        zone: zone.name,
        phone: seedUser.phone,
        shift: "06:00 - 18:00",
      });
      user.zoneManagerId = zoneManager._id;
    }

    await user.save();
  }

  const extraVolunteers = volunteerBlueprints
    .filter((blueprint) => !usedBlueprintCodes.has(blueprint.volunteerCode))
    .map((blueprint) => ({
      volunteerCode: blueprint.volunteerCode,
      name: blueprint.name,
      zoneId: blueprint.zoneId,
      zone: blueprint.zone,
      skills: blueprint.skills,
      languages: blueprint.languages,
      performance: blueprint.performance,
      fatigue: blueprint.fatigue,
      hoursToday: blueprint.hoursToday,
      status: blueprint.status,
      x: blueprint.x,
      y: blueprint.y,
      phone: blueprint.phone,
    }));
  await Volunteer.insertMany(extraVolunteers);

  const incidents = await Incident.insertMany(
    buildIncidentBlueprints().map((incident) => ({
      ...incident,
      reportedAt: new Date(incident.reportedAt),
    })),
  );
  const volunteers = await Volunteer.find().lean();

  for (const incident of incidents.filter((item) => item.status === "dispatched")) {
    const matches = rankVolunteersForIncident(incident.toObject(), volunteers).slice(0, 3);
    for (const match of matches) {
      await Assignment.create({
        incidentId: incident._id,
        volunteerId: match.volunteer._id,
        volunteerUserId: match.volunteer.userId ?? null,
        score: match.score,
        etaMin: match.etaMin,
        status: "dispatched",
        dispatchedAt: new Date(),
      });

      if (match.volunteer.userId) {
        await Task.create({
          userId: match.volunteer.userId,
          volunteerId: match.volunteer._id,
          incidentId: incident._id,
          title: `${incident.type.replaceAll("_", " ")} response`,
          details: incident.note,
          zone: incident.zone,
          severity: incident.severity,
          etaMin: match.etaMin,
          status: "open",
        });
      }
    }
  }

  const volunteerUser = await User.findOne({ role: "volunteer" }).lean();

  await Notification.insertMany([
    {
      role: "admin",
      type: "critical",
      title: "Critical incident escalated",
      message: "Lost child alert remains active in Camp A-7.",
    },
    {
      role: "zone_manager",
      type: "warning",
      title: "Zone density warning",
      message: "Sangam Nose density is above 90 percent and trending upward.",
    },
    {
      userId: volunteerUser?._id ?? null,
      role: "volunteer",
      type: "success",
      title: "Shift ready",
      message: "Your first assignment board is prepared for today's operations.",
    },
  ]);

  const chat = await Chat.create({
    title: "Command Center",
    participantIds: (await User.find().select({ _id: 1 }).lean()).map((user) => user._id),
    scope: "ops",
  });

  const users = await User.find().lean();
  await Message.insertMany([
    {
      chatId: chat._id,
      senderId: users[0]._id,
      text: "Keep command map monitoring active through the afternoon surge.",
    },
    {
      chatId: chat._id,
      senderId: users[1]._id,
      text: "Copy that. Zone managers are rebalancing volunteers now.",
    },
  ]);

  await ActivityLog.create({
    userId: users[0]._id,
    action: "seed_initialized",
    entityType: "system",
    entityId: "bootstrap",
    meta: { users: users.length, volunteers: volunteers.length },
  });
  await SystemLog.create({
    level: "info",
    message: "MongoDB seed completed successfully.",
    source: "seed",
    meta: { users: users.length, volunteers: volunteers.length, incidents: incidents.length },
  });
  await AuditLog.create({
    actorUserId: users[0]._id,
    action: "database_seeded",
    entityType: "system",
    entityId: "seed",
    after: { users: users.length, volunteers: volunteers.length, incidents: incidents.length },
  });

  seedLogger.info("Database seed completed.", {
    users: users.length,
    volunteers: volunteers.length,
    incidents: incidents.length,
  });
}

try {
  await connectDatabase();
  await seedDatabase();
} catch (error) {
  seedLogger.error("Database seed failed.", { error });
  process.exitCode = 1;
} finally {
  await disconnectDatabase().catch(() => {});
}
