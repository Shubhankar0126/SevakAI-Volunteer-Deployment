import mongoose from "mongoose";

const forecastSchema = new mongoose.Schema(
  {
    zoneId: { type: String, required: true, trim: true, index: true },
    zone: { type: String, required: true, trim: true },
    in: { type: String, required: true, trim: true },
    need: { type: String, required: true, trim: true },
    risk: { type: String, required: true, trim: true, index: true },
  },
  { timestamps: true },
);

forecastSchema.index({ zoneId: 1, risk: 1 });

export const Forecast = mongoose.models.Forecast || mongoose.model("Forecast", forecastSchema);
