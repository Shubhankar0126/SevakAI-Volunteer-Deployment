import mongoose from "mongoose";
import { SKILLS } from "../utils/constants.js";

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    phone: { type: String, default: "", trim: true, maxlength: 30 },
    zoneId: { type: String, default: "", trim: true, index: true },
    zone: { type: String, default: "", trim: true },
    languages: { type: [String], default: ["Hindi", "English"] },
    skills: { type: [String], enum: SKILLS, default: [] },
    avatarUrl: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

export const Profile = mongoose.models.Profile || mongoose.model("Profile", profileSchema);
