import { z } from "zod";

export const createIncidentSchema = z.object({
  type: z.enum(["medical", "lost_child", "crowd_surge", "fire", "security", "lost_item"]),
  zoneId: z.string().optional(),
  zone: z.string().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  note: z.string().min(5).max(500),
  required: z
    .array(
      z.enum(["medical", "security", "crowd", "lost_found", "translator", "logistics", "fire"]),
    )
    .optional(),
  x: z.number().min(0).max(100).optional(),
  y: z.number().min(0).max(100).optional(),
});

export const updateIncidentStatusSchema = z.object({
  status: z.enum(["open", "dispatched", "resolved"]),
});

export const sosSchema = z.object({
  kind: z.enum(["critical", "medical", "crowd"]).default("critical"),
});
