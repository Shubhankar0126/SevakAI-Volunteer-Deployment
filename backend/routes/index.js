import { Router } from "express";
import assignmentRoutes from "./assignment.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import authRoutes from "./auth.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import geminiRoutes from "./gemini.routes.js";
import incidentRoutes from "./incident.routes.js";
import messageRoutes from "./message.routes.js";
import notificationRoutes from "./notification.routes.js";
import reportRoutes from "./report.routes.js";
import uploadRoutes from "./upload.routes.js";
import volunteerRoutes from "./volunteer.routes.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/dashboard", requireAuth, dashboardRoutes);
router.use("/volunteers", requireAuth, volunteerRoutes);
router.use("/assignments", requireAuth, assignmentRoutes);
router.use("/incidents", requireAuth, incidentRoutes);
router.use("/analytics", requireAuth, analyticsRoutes);
router.use("/notifications", requireAuth, notificationRoutes);
router.use("/attendance", requireAuth, attendanceRoutes);
router.use("/reports", requireAuth, reportRoutes);
router.use("/gemini", requireAuth, geminiRoutes);
router.use("/uploads", requireAuth, uploadRoutes);
router.use("/messages", requireAuth, messageRoutes);

export default router;
