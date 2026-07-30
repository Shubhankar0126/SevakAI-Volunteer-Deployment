import { z } from "zod";

export const assistantSchema = z.object({
  question: z.string().min(1).max(2000),
});
