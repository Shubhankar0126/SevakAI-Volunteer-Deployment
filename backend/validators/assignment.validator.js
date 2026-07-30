import { z } from "zod";

export const dispatchSchema = z.object({
  limit: z.number().int().min(1).max(10).optional().default(3),
});
