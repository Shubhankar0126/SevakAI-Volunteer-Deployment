import mongoose from "mongoose";
import { ASSIGNMENT_STATUSES } from "../utils/constants.js";

const assignmentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
      required: true,
      index: true,
    },
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Volunteer",
      required: true,
      index: true,
    },
    volunteerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    score: { type: Number, required: true, min: 0, max: 100 },
    etaMin: { type: Number, required: true, min: 0, max: 1440 },
    status: { type: String, enum: ASSIGNMENT_STATUSES, default: "pending", index: true },
    dispatchedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

assignmentSchema.index({ incidentId: 1, volunteerId: 1 }, { unique: true });
assignmentSchema.index({ volunteerUserId: 1, status: 1 });

export const Assignment =
  mongoose.models.Assignment || mongoose.model("Assignment", assignmentSchema);
