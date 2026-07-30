import mongoose from "mongoose";
import { APP_ROLES } from "../utils/constants.js";

const roleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, enum: APP_ROLES, required: true, index: true },
  },
  { timestamps: true },
);

export const Role = mongoose.models.Role || mongoose.model("Role", roleSchema);
