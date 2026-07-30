import { z } from "zod";

export const uploadReplaceSchema = z.object({
  publicId: z.string().min(1).max(500),
});

export const uploadDeleteSchema = z.object({
  publicId: z.string().min(1).max(500),
});

export const uploadCleanupSchema = z.object({
  publicIds: z.array(z.string().min(1).max(500)).min(1).max(100),
});
