import crypto from "node:crypto";
import mongoose from "mongoose";
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
import { ApiError } from "../utils/api-error.js";
import { APP_ROLES } from "../utils/constants.js";
import { buildShift, rankVolunteersForIncident } from "../utils/operations.js";
import { logger } from "../utils/logger.js";

const storeLogger = logger.child({ component: "data-store" });

const ALL_MODELS = [
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sameId(left, right) {
  if (left == null || right == null) {
    return false;
  }

  return String(left) === String(right);
}

function toObjectIdIfValid(value) {
  if (!value) {
    return null;
  }

  return mongoose.Types.ObjectId.isValid(String(value))
    ? new mongoose.Types.ObjectId(String(value))
    : null;
}

function normalizeDocument(document) {
  if (!document) {
    return null;
  }

  const plain =
    typeof document.toObject === "function"
      ? document.toObject({ virtuals: true })
      : clone(document);

  plain.id = String(
    plain._id ?? plain.id ?? plain.zoneCode ?? plain.incidentCode ?? plain.volunteerCode,
  );

  if (plain._id) {
    plain._id = String(plain._id);
  }

  for (const key of [
    "userId",
    "profileId",
    "volunteerId",
    "zoneManagerId",
    "incidentId",
    "chatId",
    "senderId",
    "reportedBy",
    "actorUserId",
  ]) {
    if (plain[key]) {
      plain[key] = String(plain[key]);
    }
  }

  for (const key of [
    "reportedAt",
    "createdAt",
    "updatedAt",
    "capturedAt",
    "dispatchedAt",
    "lockedUntil",
    "lastLoginAt",
  ]) {
    if (plain[key]) {
      plain[key] = new Date(plain[key]).toISOString();
    }
  }

  if (plain.refreshToken?.expiresAt) {
    plain.refreshToken.expiresAt = new Date(plain.refreshToken.expiresAt).toISOString();
  }

  if (plain.passwordReset?.expiresAt) {
    plain.passwordReset.expiresAt = new Date(plain.passwordReset.expiresAt).toISOString();
  }

  if (plain.passwordReset?.requestedAt) {
    plain.passwordReset.requestedAt = new Date(plain.passwordReset.requestedAt).toISOString();
  }

  return plain;
}

function normalizeList(items) {
  return items.map((item) => normalizeDocument(item));
}

function sanitizeUserForContext(user) {
  if (!user) {
    return null;
  }

  return {
    id: String(user._id ?? user.id),
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl ?? "",
    lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
    lockedUntil: user.lockedUntil ? new Date(user.lockedUntil).toISOString() : null,
  };
}

function mapZone(zone) {
  const normalized = normalizeDocument(zone);
  return {
    ...normalized,
    id: normalized.zoneCode ?? normalized.id,
  };
}

function ensureSupportedRole(role) {
  if (!APP_ROLES.includes(role)) {
    throw new ApiError(400, "Unsupported role.");
  }
}

function buildVolunteerBundle({ role, fullName, phone, zone }) {
  return {
    volunteerCode: `V${Math.floor(Date.now() / 1000)}`,
    name: fullName,
    zoneId: zone.zoneCode,
    zone: zone.name,
    skills: role === "volunteer" ? ["crowd", "medical"] : ["security", "crowd"],
    languages: ["Hindi", "English"],
    performance: 72,
    fatigue: 20,
    hoursToday: 0,
    status: "available",
    x: zone.x,
    y: zone.y,
    phone,
  };
}

async function findDefaultZone(session = null) {
  const query = Zone.findOne().sort({ zoneCode: 1 });
  if (session) {
    query.session(session);
  }

  const zone = await query.lean();
  if (!zone) {
    throw new ApiError(500, "No zones are configured. Seed the database before creating accounts.");
  }

  return zone;
}

async function nextIncidentCode() {
  const latest = await Incident.findOne()
    .sort({ createdAt: -1, incidentCode: -1 })
    .select({ incidentCode: 1 })
    .lean();

  const fallback = `INC-${Date.now()}`;
  if (!latest?.incidentCode) {
    return fallback;
  }

  const match = latest.incidentCode.match(/(\d+)$/);
  if (!match) {
    return fallback;
  }

  return `INC-${Number(match[1]) + 1}`;
}

async function loadLatestAnalyticsMetric(metricType) {
  const record = await Analytics.findOne({ metricType })
    .sort({ capturedAt: -1, createdAt: -1 })
    .lean();

  return record?.payload ?? [];
}

async function loadChatById(chatId) {
  const query = { _id: toObjectIdIfValid(chatId) ?? chatId };
  return Chat.findOne(query).lean();
}

export async function initializeDataStore() {
  await Promise.all(ALL_MODELS.map((model) => model.init()));
  storeLogger.info("Mongo-backed datastore initialized.");
}

export async function findUserByEmail(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).lean();
  return normalizeDocument(user);
}

export async function findUserById(userId) {
  const queryId = toObjectIdIfValid(userId) ?? userId;
  const user = await User.findById(queryId).lean();
  return normalizeDocument(user);
}

export async function findUserByPasswordResetToken(tokenHash) {
  const user = await User.findOne({
    "passwordReset.tokenHash": tokenHash,
  }).lean();
  return normalizeDocument(user);
}

export async function getUserContextById(userId) {
  const queryId = toObjectIdIfValid(userId) ?? userId;
  const user = await User.findById(queryId).lean();

  if (!user || !user.isActive) {
    return null;
  }

  const [profile, volunteer, zoneManager] = await Promise.all([
    user.profileId ? Profile.findById(user.profileId).lean() : null,
    user.volunteerId ? Volunteer.findById(user.volunteerId).lean() : null,
    user.zoneManagerId ? ZoneManager.findById(user.zoneManagerId).lean() : null,
  ]);

  return {
    user: sanitizeUserForContext(user),
    role: user.role,
    profile: normalizeDocument(profile),
    volunteer: normalizeDocument(volunteer),
    zoneManager: normalizeDocument(zoneManager),
  };
}

export async function setUserRefreshToken(userId, tokenHash, expiresAt) {
  await User.findByIdAndUpdate(
    toObjectIdIfValid(userId) ?? userId,
    {
      refreshToken: {
        tokenHash,
        expiresAt,
      },
    },
    { new: true },
  );
}

export async function clearUserRefreshToken(userId) {
  await User.findByIdAndUpdate(
    toObjectIdIfValid(userId) ?? userId,
    {
      refreshToken: null,
    },
    { new: true },
  );
}

export async function setPasswordResetToken(userId, tokenHash, expiresAt) {
  await User.findByIdAndUpdate(toObjectIdIfValid(userId) ?? userId, {
    passwordReset: {
      tokenHash,
      expiresAt,
      requestedAt: new Date(),
    },
  });
}

export async function clearPasswordResetToken(userId) {
  await User.findByIdAndUpdate(toObjectIdIfValid(userId) ?? userId, {
    passwordReset: null,
  });
}

export async function updateUserPassword(userId, passwordHash) {
  await User.findByIdAndUpdate(toObjectIdIfValid(userId) ?? userId, {
    passwordHash,
    passwordReset: null,
    lastPasswordChangedAt: new Date(),
    failedLoginAttempts: 0,
    lockedUntil: null,
  });
}

export async function recordFailedLoginAttempt(userId, maxAttempts, lockDurationMs) {
  const queryId = toObjectIdIfValid(userId) ?? userId;
  const user = await User.findById(queryId).lean();
  if (!user) {
    return null;
  }

  const failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1;
  const shouldLock = failedLoginAttempts >= maxAttempts;
  const update = {
    failedLoginAttempts,
    lockedUntil: shouldLock ? new Date(Date.now() + lockDurationMs) : null,
  };

  await User.findByIdAndUpdate(queryId, update);
  return {
    failedLoginAttempts,
    lockedUntil: update.lockedUntil ? update.lockedUntil.toISOString() : null,
  };
}

export async function clearFailedLoginAttempts(userId) {
  await User.findByIdAndUpdate(toObjectIdIfValid(userId) ?? userId, {
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: new Date(),
  });
}

export async function createUserBundle({ email, passwordHash, fullName, phone, role }) {
  ensureSupportedRole(role);
  const session = await mongoose.startSession();

  try {
    let createdUserId = null;

    await session.withTransaction(async () => {
      const zone = await findDefaultZone(session);
      const [user] = await User.create(
        [
          {
            email: email.toLowerCase().trim(),
            passwordHash,
            role,
            fullName,
            phone,
            isActive: true,
          },
        ],
        { session },
      );

      const [profile] = await Profile.create(
        [
          {
            userId: user._id,
            fullName,
            phone,
            zoneId: zone.zoneCode,
            zone: zone.name,
            languages: ["Hindi", "English"],
            skills: role === "volunteer" ? ["crowd", "medical"] : ["security", "crowd"],
          },
        ],
        { session },
      );

      await Role.create([{ userId: user._id, name: role }], { session });

      user.profileId = profile._id;

      if (role === "volunteer") {
        const [volunteer] = await Volunteer.create(
          [buildVolunteerBundle({ role, fullName, phone, zone })],
          { session },
        );
        volunteer.userId = user._id;
        await volunteer.save({ session });
        user.volunteerId = volunteer._id;

        await Attendance.updateOne(
          {
            userId: user._id,
            date: new Date().toISOString().slice(0, 10),
          },
          {
            $setOnInsert: {
              volunteerId: volunteer._id,
              shiftStart: "06:00",
              shiftEnd: "18:00",
              hoursWorked: 0,
              status: "checked_in",
            },
          },
          { upsert: true, session },
        );
      }

      if (role === "zone_manager") {
        const [zoneManager] = await ZoneManager.create(
          [
            {
              userId: user._id,
              zoneId: zone.zoneCode,
              zone: zone.name,
              phone,
              shift: "06:00 - 18:00",
            },
          ],
          { session },
        );
        user.zoneManagerId = zoneManager._id;
      }

      await user.save({ session });
      createdUserId = user._id;

      await Notification.create(
        [
          {
            userId: user._id,
            role,
            type: "success",
            title: "Welcome to SevakAI",
            message: "Your account is ready to access the command center.",
          },
        ],
        { session },
      );
    });

    return getUserContextById(createdUserId);
  } finally {
    await session.endSession();
  }
}

export async function listVolunteers({ search = "", skill = "all", status = "all" } = {}) {
  const query = {};
  const trimmedSearch = search.trim();

  if (skill !== "all") {
    query.skills = skill;
  }

  if (status !== "all") {
    query.status = status;
  }

  if (trimmedSearch) {
    query.$or = [
      { name: { $regex: trimmedSearch, $options: "i" } },
      { zone: { $regex: trimmedSearch, $options: "i" } },
      { volunteerCode: { $regex: trimmedSearch, $options: "i" } },
    ];
  }

  const volunteers = await Volunteer.find(query)
    .sort({ status: 1, performance: -1, name: 1 })
    .lean();

  return normalizeList(volunteers);
}

export async function listZones() {
  const zones = await Zone.find().sort({ name: 1 }).lean();
  return zones.map((zone) => mapZone(zone));
}

export async function listIncidents({ status, zoneId } = {}) {
  const query = {};

  if (status) {
    query.status = status;
  }

  if (zoneId) {
    query.zoneId = zoneId;
  }

  const incidents = await Incident.find(query).sort({ reportedAt: -1, severity: -1 }).lean();

  return normalizeList(incidents);
}

export async function getIncidentById(incidentId) {
  const objectId = toObjectIdIfValid(incidentId);
  const incident = await Incident.findOne({
    $or: [objectId ? { _id: objectId } : null, { incidentCode: incidentId }].filter(Boolean),
  }).lean();

  return normalizeDocument(incident);
}

export async function updateIncidentStatus(incidentId, status) {
  const objectId = toObjectIdIfValid(incidentId);
  const incident = await Incident.findOneAndUpdate(
    {
      $or: [objectId ? { _id: objectId } : null, { incidentCode: incidentId }].filter(Boolean),
    },
    { status },
    { new: true },
  ).lean();

  if (!incident) {
    throw new ApiError(404, "Incident not found.");
  }

  return normalizeDocument(incident);
}

export async function createIncidentRecord(payload, userContext = null) {
  const zoneQuery = payload.zoneId
    ? { zoneCode: payload.zoneId }
    : payload.zone
      ? { name: payload.zone }
      : {};

  const zone =
    (Object.keys(zoneQuery).length > 0 ? await Zone.findOne(zoneQuery).lean() : null) ??
    (await Zone.findOne().sort({ zoneCode: 1 }).lean());

  if (!zone) {
    throw new ApiError(
      500,
      "No zones are configured. Seed the database before creating incidents.",
    );
  }

  const incident = await Incident.create({
    incidentCode: await nextIncidentCode(),
    type: payload.type,
    zoneId: zone.zoneCode,
    zone: zone.name,
    severity: payload.severity,
    reportedAt: new Date(),
    status: "open",
    required: payload.required?.length ? payload.required : inferRequiredSkills(payload.type),
    x: payload.x ?? zone.x,
    y: payload.y ?? zone.y,
    note: payload.note,
    reportedBy: userContext?.user?.id ?? null,
  });

  return normalizeDocument(incident);
}

function inferRequiredSkills(type) {
  if (type === "medical") return ["medical"];
  if (type === "lost_child") return ["lost_found", "security"];
  if (type === "crowd_surge") return ["crowd", "security"];
  if (type === "fire") return ["fire", "security"];
  if (type === "security") return ["security"];
  return ["lost_found"];
}

export async function createNotificationEntry(entry) {
  const notification = await Notification.create(entry);
  return normalizeDocument(notification);
}

export async function markNotificationRead(notificationId, userContext) {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: toObjectIdIfValid(notificationId) ?? notificationId,
      $or: [{ userId: userContext.user.id }, { role: userContext.role }, { userId: null }],
    },
    { read: true },
    { new: true },
  ).lean();

  if (!notification) {
    throw new ApiError(404, "Notification not found.");
  }

  return normalizeDocument(notification);
}

export async function listNotificationsForUser(userContext) {
  const notifications = await Notification.find({
    $or: [
      { userId: userContext.user.id },
      { userId: null, role: userContext.role },
      { userId: null, role: null },
    ],
  })
    .sort({ read: 1, createdAt: -1 })
    .lean();

  return normalizeList(notifications);
}

export async function listChatsForUser(userContext) {
  const chats = await Chat.find({
    participantIds: toObjectIdIfValid(userContext.user.id) ?? userContext.user.id,
  })
    .sort({ updatedAt: -1 })
    .lean();

  return normalizeList(chats);
}

export async function listMessagesForChat(chatId) {
  const messages = await Message.find({
    chatId: toObjectIdIfValid(chatId) ?? chatId,
  })
    .sort({ createdAt: 1 })
    .lean();

  return normalizeList(messages);
}

export async function createMessageEntry({ chatId, senderId, text }) {
  const chat = await loadChatById(chatId);
  if (!chat) {
    throw new ApiError(404, "Chat not found.");
  }

  const message = await Message.create({
    chatId: chat._id,
    senderId: toObjectIdIfValid(senderId) ?? senderId,
    text,
  });

  await Chat.findByIdAndUpdate(chat._id, { updatedAt: new Date() });
  return normalizeDocument(message);
}

export async function listAssignments() {
  return normalizeList(await Assignment.find().sort({ createdAt: -1 }).lean());
}

export async function listTasks() {
  return normalizeList(await Task.find().sort({ createdAt: -1 }).lean());
}

export async function listAttendance() {
  return normalizeList(await Attendance.find().sort({ date: -1 }).lean());
}

export async function getAttendanceForUser(userContext) {
  const attendance = await Attendance.findOne({
    userId: toObjectIdIfValid(userContext.user.id) ?? userContext.user.id,
  })
    .sort({ date: -1 })
    .lean();

  return normalizeDocument(attendance);
}

export async function createAttendanceEntry({ userId, volunteerId, hoursWorked }) {
  const today = new Date().toISOString().slice(0, 10);
  const attendance = await Attendance.findOneAndUpdate(
    {
      userId: toObjectIdIfValid(userId) ?? userId,
      date: today,
    },
    {
      $set: {
        volunteerId: toObjectIdIfValid(volunteerId) ?? volunteerId,
        shiftStart: "06:00",
        shiftEnd: "18:00",
        hoursWorked,
        status: "checked_in",
      },
    },
    { upsert: true, new: true },
  ).lean();

  return normalizeDocument(attendance);
}

export async function createActivityLogEntry(entry) {
  const logEntry = await ActivityLog.create(entry);
  return normalizeDocument(logEntry);
}

export async function createSystemLogEntry(entry) {
  const logEntry = await SystemLog.create(entry);
  return normalizeDocument(logEntry);
}

export async function createAuditLogEntry(entry) {
  const logEntry = await AuditLog.create(entry);
  return normalizeDocument(logEntry);
}

function mergeTasks(computedTasks, storedTasks) {
  const merged = new Map();

  [...storedTasks, ...computedTasks].forEach((task) => {
    const key = `${task.incidentId}`;
    if (!merged.has(key)) {
      merged.set(key, task);
    }
  });

  return Array.from(merged.values()).sort((left, right) => {
    const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
    return (severityWeight[right.severity] ?? 0) - (severityWeight[left.severity] ?? 0);
  });
}

export async function getTasksForUser(userContext, operationsData = null) {
  if (userContext.role !== "volunteer" || !userContext.volunteer) {
    return [];
  }

  const data =
    operationsData ??
    (await Promise.all([listIncidents({}), listVolunteers({}), listTasks()]).then(
      ([incidents, volunteers, tasks]) => ({
        incidents,
        volunteers,
        tasks,
      }),
    ));

  const computedTasks = data.incidents
    .filter((incident) => incident.status !== "resolved")
    .map((incident) => ({
      incident,
      match: rankVolunteersForIncident(incident, data.volunteers).find((item) =>
        sameId(item.volunteer._id ?? item.volunteer.id, userContext.volunteer.id),
      ),
    }))
    .filter((item) => item.match && item.match.score > 40)
    .sort((left, right) => right.match.score - left.match.score)
    .map(({ incident, match }) => ({
      id: `computed-${incident.id}`,
      incidentId: incident.id,
      title: incident.type,
      details: incident.note,
      zone: incident.zone,
      severity: incident.severity,
      etaMin: match.etaMin,
      score: match.score,
      status: incident.status,
    }));

  const storedTasks = data.tasks
    .filter(
      (task) =>
        sameId(task.userId, userContext.user.id) ||
        sameId(task.volunteerId, userContext.volunteer.id),
    )
    .map((task) => ({
      id: task.id,
      incidentId: String(task.incidentId),
      title: task.title,
      details: task.details,
      zone: task.zone,
      severity: task.severity,
      etaMin: task.etaMin,
      score: 100,
      status: task.status,
    }));

  return mergeTasks(computedTasks, storedTasks);
}

export async function getShiftForUser(userContext) {
  if (userContext.role !== "volunteer" || !userContext.volunteer) {
    return [];
  }

  return buildShift(userContext.volunteer);
}

export async function getOperationsSnapshot(userContext) {
  const [
    zones,
    volunteers,
    incidents,
    forecasts,
    notifications,
    hourlyLoad,
    zonePerformance,
    assignments,
    tasks,
  ] = await Promise.all([
    listZones(),
    listVolunteers({}),
    listIncidents({}),
    normalizeList(await Forecast.find().sort({ risk: -1, createdAt: -1 }).lean()),
    listNotificationsForUser(userContext),
    loadLatestAnalyticsMetric("hourlyLoad"),
    loadLatestAnalyticsMetric("zonePerformance"),
    listAssignments(),
    listTasks(),
  ]);

  const myTasks = await getTasksForUser(userContext, {
    incidents,
    volunteers,
    tasks,
  });
  const myShift = await getShiftForUser(userContext);
  const activeVolunteers = volunteers.filter((volunteer) => volunteer.status !== "off").length;
  const availableVolunteers = volunteers.filter(
    (volunteer) => volunteer.status === "available",
  ).length;
  const openIncidents = incidents.filter((incident) => incident.status !== "resolved").length;
  const averagePerformance =
    volunteers.length > 0
      ? Math.round(
          volunteers.reduce((total, volunteer) => total + volunteer.performance, 0) /
            volunteers.length,
        )
      : 0;

  return {
    me: userContext,
    zones,
    volunteers,
    incidents,
    forecasts,
    notifications,
    hourlyLoad,
    zonePerformance,
    assignments,
    myTasks,
    myShift,
    stats: {
      activeVolunteers,
      availableVolunteers,
      openIncidents,
      averagePerformance,
      incidents: incidents.length,
      volunteers: volunteers.length,
    },
  };
}

export async function getRecommendationsForIncident(incidentId, limit = 8) {
  const [incident, volunteers] = await Promise.all([
    getIncidentById(incidentId),
    listVolunteers({}),
  ]);

  if (!incident) {
    throw new ApiError(404, "Incident not found.");
  }

  return rankVolunteersForIncident(incident, volunteers).slice(0, limit);
}

export async function dispatchIncidentAssignments(incidentId, limit = 3) {
  const incident = await getIncidentById(incidentId);
  if (!incident) {
    throw new ApiError(404, "Incident not found.");
  }

  const volunteers = await listVolunteers({});
  const matches = rankVolunteersForIncident(incident, volunteers).slice(0, limit);
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const incidentObjectId = toObjectIdIfValid(incident.id) ?? incident.id;

      await Incident.findByIdAndUpdate(incidentObjectId, { status: "dispatched" }, { session });

      for (const match of matches) {
        const volunteerObjectId = toObjectIdIfValid(match.volunteer.id) ?? match.volunteer.id;

        await Assignment.updateOne(
          {
            incidentId: incidentObjectId,
            volunteerId: volunteerObjectId,
          },
          {
            $setOnInsert: {
              volunteerUserId: match.volunteer.userId ?? null,
              score: match.score,
              etaMin: match.etaMin,
              status: "dispatched",
              dispatchedAt: new Date(),
            },
          },
          { upsert: true, session },
        );

        if (match.volunteer.userId) {
          await Task.updateOne(
            {
              incidentId: incidentObjectId,
              volunteerId: volunteerObjectId,
            },
            {
              $setOnInsert: {
                userId: toObjectIdIfValid(match.volunteer.userId) ?? match.volunteer.userId,
                title: `${incident.type.replaceAll("_", " ")} response`,
                details: incident.note,
                zone: incident.zone,
                severity: incident.severity,
                etaMin: match.etaMin,
                status: "open",
              },
            },
            { upsert: true, session },
          );
        }
      }
    });
  } finally {
    await session.endSession();
  }

  return matches;
}

export async function buildReportSummary(userContext) {
  const snapshot = await getOperationsSnapshot(userContext);
  const criticalIncidents = snapshot.incidents.filter(
    (incident) => incident.severity === "critical",
  );
  const overloadedZones = snapshot.zones
    .filter((zone) => zone.density >= 70)
    .sort((left, right) => right.density - left.density)
    .slice(0, 3);

  return {
    generatedAt: new Date().toISOString(),
    totals: snapshot.stats,
    criticalIncidents,
    overloadedZones,
    averageFatigue:
      snapshot.volunteers.length > 0
        ? Math.round(
            snapshot.volunteers.reduce((total, volunteer) => total + volunteer.fatigue, 0) /
              snapshot.volunteers.length,
          )
        : 0,
    recommendations: snapshot.forecasts,
  };
}

export function issuePasswordResetToken() {
  return crypto.randomBytes(32).toString("hex");
}
