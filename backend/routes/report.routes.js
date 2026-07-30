import { Router } from "express";
import { summary } from "../controllers/report.controller.js";

const router = Router();

router.get("/summary", summary);

export default router;
