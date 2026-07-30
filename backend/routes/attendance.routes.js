import { Router } from "express";
import { checkIn, myAttendance } from "../controllers/attendance.controller.js";

const router = Router();

router.get("/me", myAttendance);
router.post("/check-in", checkIn);

export default router;
