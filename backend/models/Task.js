import mongoose from "mongoose";
import { INCIDENT_SEVERITIES, TASK_STATUSES } from "../utils/constants.js";

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Volunteer",
      required: true,
      index: true,
    },
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    details: { type: String, required: true, trim: true, maxlength: 2000 },
    zone: { type: String, required: true, trim: true, maxlength: 120 },
    severity: { type: String, enum: INCIDENT_SEVERITIES, required: true, index: true },
    etaMin: { type: Number, required: true, min: 0, max: 1440 },
    status: { type: String, enum: TASK_STATUSES, default: "open", index: true },
  },
  { timestamps: true },
);

taskSchema.index({ incidentId: 1, volunteerId: 1 }, { unique: true });
taskSchema.index({ userId: 1, status: 1 });

export const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);
