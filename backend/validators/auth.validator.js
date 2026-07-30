import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().max(30).optional().default(""),
  role: z.enum(["admin", "zone_manager", "volunteer"]),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(256),
  password: z.string().min(8).max(128),
});
