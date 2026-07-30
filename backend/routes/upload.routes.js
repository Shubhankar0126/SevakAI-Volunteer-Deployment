import { Router } from "express";
import multer from "multer";
import {
  cleanupUploads,
  deleteImage,
  replaceImage,
  uploadImage,
} from "../controllers/upload.controller.js";
import { validate } from "../middleware/validate.js";
import {
  uploadCleanupSchema,
  uploadDeleteSchema,
  uploadReplaceSchema,
} from "../validators/upload.validator.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post("/image", upload.single("file"), uploadImage);
router.put("/image", upload.single("file"), validate({ body: uploadReplaceSchema }), replaceImage);
router.delete("/image", validate({ body: uploadDeleteSchema }), deleteImage);
router.post("/cleanup", validate({ body: uploadCleanupSchema }), cleanupUploads);

export default router;
