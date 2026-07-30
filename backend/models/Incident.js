import mongoose from "mongoose";
import {
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  INCIDENT_TYPES,
  SKILLS,
} from "../utils/constants.js";

const incidentSchema = new mongoose.Schema(
  {
    incidentCode: { type: String, required: true, unique: true, trim: true },
    type: { type: String, enum: INCIDENT_TYPES, required: true, index: true },
    zoneId: { type: String, required: true, trim: true, index: true },
    zone: { type: String, required: true, trim: true },
    severity: { type: String, enum: INCIDENT_SEVERITIES, required: true, index: true },
    reportedAt: { type: Date, required: true, index: true },
    status: { type: String, enum: INCIDENT_STATUSES, default: "open", index: true },
    required: { type: [String], enum: SKILLS, default: [] },
    x: { type: Number, required: true, min: 0, max: 100 },
    y: { type: Number, required: true, min: 0, max: 100 },
    note: { type: String, required: true, trim: true, minlength: 3, maxlength: 2000 },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

incidentSchema.index({ status: 1, severity: -1, reportedAt: -1 });
incidentSchema.index({ zoneId: 1, status: 1 });

export const Incident = mongoose.models.Incident || mongoose.model("Incident", incidentSchema);
