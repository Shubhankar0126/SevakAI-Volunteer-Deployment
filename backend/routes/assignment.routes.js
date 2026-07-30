import { Router } from "express";
import { dispatch, recommendations } from "../controllers/assignment.controller.js";
import { validate } from "../middleware/validate.js";
import { dispatchSchema } from "../validators/assignment.validator.js";

const router = Router();

router.get("/:incidentId/recommendations", recommendations);
router.post("/:incidentId/dispatch", validate({ body: dispatchSchema }), dispatch);

export default router;
