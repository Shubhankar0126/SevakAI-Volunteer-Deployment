import { Router } from "express";
import { createMessage, listChats, listMessages } from "../controllers/message.controller.js";
import { validate } from "../middleware/validate.js";
import { messageSchema } from "../validators/message.validator.js";

const router = Router();

router.get("/chats", listChats);
router.get("/chats/:chatId/messages", listMessages);
router.post("/", validate({ body: messageSchema }), createMessage);

export default router;
