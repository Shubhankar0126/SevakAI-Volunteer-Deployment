import { Router } from "express";
import { analytics, mapData, overview, snapshot } from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/snapshot", snapshot);
router.get("/overview", overview);
router.get("/map", mapData);
router.get("/analytics", analytics);

export default router;
