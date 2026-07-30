import mongoose from "mongoose";
import { APP_ROLES } from "../utils/constants.js";

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, trim: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false },
);

const passwordResetSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, trim: true },
    expiresAt: { type: Date, required: true },
    requestedAt: { type: Date, required: true },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 5,
      maxlength: 160,
    },
    passwordHash: { type: String, required: true, minlength: 20 },
    role: { type: String, enum: APP_ROLES, required: true, index: true },
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    phone: { type: String, default: "", trim: true, maxlength: 30 },
    avatarUrl: { type: String, default: "", trim: true, maxlength: 500 },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", default: null },
    volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: "Volunteer", default: null },
    zoneManagerId: { type: mongoose.Schema.Types.ObjectId, ref: "ZoneManager", default: null },
    refreshToken: { type: refreshTokenSchema, default: null },
    passwordReset: { type: passwordResetSchema, default: null },
    failedLoginAttempts: { type: Number, default: 0, min: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    lastPasswordChangedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_document, returned) {
        delete returned.passwordHash;
        delete returned.refreshToken;
        delete returned.passwordReset;
        return returned;
      },
    },
    toObject: { virtuals: true },
  },
);

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ lockedUntil: 1 });
userSchema.virtual("isLocked").get(function isLocked() {
  return Boolean(this.lockedUntil && this.lockedUntil.getTime() > Date.now());
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
