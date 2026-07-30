import { Router } from "express";
import {
  create,
  list,
  resolve,
  triggerSos,
  updateStatus,
} from "../controllers/incident.controller.js";
import { validate } from "../middleware/validate.js";
import {
  createIncidentSchema,
  sosSchema,
  updateIncidentStatusSchema,
} from "../validators/incident.validator.js";

const router = Router();

router.get("/", list);
router.post("/", validate({ body: createIncidentSchema }), create);
router.patch("/:incidentId/status", validate({ body: updateIncidentStatusSchema }), updateStatus);
router.post("/:incidentId/resolve", resolve);
router.post("/sos", validate({ body: sosSchema }), triggerSos);

export default router;
