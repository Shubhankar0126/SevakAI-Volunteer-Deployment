import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    metricType: { type: String, required: true, trim: true, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    capturedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

analyticsSchema.index({ metricType: 1, capturedAt: -1 });

export const Analytics = mongoose.models.Analytics || mongoose.model("Analytics", analyticsSchema);
