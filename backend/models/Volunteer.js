import mongoose from "mongoose";
import { SKILLS, VOLUNTEER_STATUSES } from "../utils/constants.js";

const volunteerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    volunteerCode: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    zoneId: { type: String, required: true, trim: true, index: true },
    zone: { type: String, required: true, trim: true },
    skills: { type: [String], enum: SKILLS, default: [] },
    languages: { type: [String], default: [] },
    performance: { type: Number, default: 70, min: 0, max: 100 },
    fatigue: { type: Number, default: 20, min: 0, max: 100 },
    hoursToday: { type: Number, default: 0, min: 0, max: 24 },
    status: { type: String, enum: VOLUNTEER_STATUSES, default: "available", index: true },
    x: { type: Number, required: true, min: 0, max: 100 },
    y: { type: Number, required: true, min: 0, max: 100 },
    phone: { type: String, default: "", trim: true, maxlength: 30 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

volunteerSchema.index({ zoneId: 1, status: 1 });
volunteerSchema.index({ skills: 1 });

export const Volunteer = mongoose.models.Volunteer || mongoose.model("Volunteer", volunteerSchema);
