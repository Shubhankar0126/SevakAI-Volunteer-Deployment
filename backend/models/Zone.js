import mongoose from "mongoose";

const zoneSchema = new mongoose.Schema(
  {
    zoneCode: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    density: { type: Number, required: true, min: 0, max: 100, index: true },
    active: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, min: 1 },
    x: { type: Number, required: true, min: 0, max: 100 },
    y: { type: Number, required: true, min: 0, max: 100 },
    status: { type: String, default: "healthy", trim: true, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

zoneSchema.virtual("utilization").get(function utilization() {
  return this.capacity > 0 ? Math.round((this.active / this.capacity) * 100) : 0;
});

export const Zone = mongoose.models.Zone || mongoose.model("Zone", zoneSchema);
