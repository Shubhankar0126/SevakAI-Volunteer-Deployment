import { Router } from "express";
import { askAssistant } from "../controllers/gemini.controller.js";
import { validate } from "../middleware/validate.js";
import { assistantSchema } from "../validators/gemini.validator.js";

const router = Router();

router.post("/assistant", validate({ body: assistantSchema }), askAssistant);

export default router;
