import mongoose from "mongoose";
import { ATTENDANCE_STATUSES } from "../utils/constants.js";

const attendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Volunteer",
      required: true,
      index: true,
    },
    date: { type: String, required: true, trim: true, index: true },
    shiftStart: { type: String, default: "06:00", trim: true, maxlength: 10 },
    shiftEnd: { type: String, default: "18:00", trim: true, maxlength: 10 },
    hoursWorked: { type: Number, default: 0, min: 0, max: 24 },
    status: { type: String, enum: ATTENDANCE_STATUSES, default: "checked_in", index: true },
  },
  { timestamps: true },
);

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export const Attendance =
  mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
