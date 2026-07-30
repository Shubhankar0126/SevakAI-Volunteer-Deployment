import mongoose from "mongoose";
import { SYSTEM_LOG_LEVELS } from "../utils/constants.js";

const systemLogSchema = new mongoose.Schema(
  {
    level: { type: String, enum: SYSTEM_LOG_LEVELS, required: true, index: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    source: { type: String, required: true, trim: true, maxlength: 100, index: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

systemLogSchema.index({ level: 1, createdAt: -1 });
systemLogSchema.index({ source: 1, createdAt: -1 });

export const SystemLog = mongoose.models.SystemLog || mongoose.model("SystemLog", systemLogSchema);
