import { Router } from "express";
import { getOne, list } from "../controllers/volunteer.controller.js";

const router = Router();

router.get("/", list);
router.get("/:volunteerId", getOne);

export default router;
