import { z } from "zod";

export const messageSchema = z.object({
  chatId: z.string().min(1),
  text: z.string().min(1).max(1500),
});
