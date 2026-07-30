import mongoose from "mongoose";

const zoneManagerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    zoneId: { type: String, required: true, trim: true, index: true },
    zone: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true, maxlength: 30 },
    shift: { type: String, default: "06:00 - 18:00", trim: true, maxlength: 50 },
  },
  { timestamps: true },
);

export const ZoneManager =
  mongoose.models.ZoneManager || mongoose.model("ZoneManager", zoneManagerSchema);
