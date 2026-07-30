import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess } from "../utils/response.js";
import { getChats, getMessages, sendMessage } from "../services/message.service.js";
import { emitMessageCreated } from "../socket/index.js";

export const listChats = asyncHandler(async (request, response) => {
  sendSuccess(response, await getChats(request.auth));
});

export const listMessages = asyncHandler(async (request, response) => {
  sendSuccess(response, await getMessages(request.params.chatId));
});

export const createMessage = asyncHandler(async (request, response) => {
  const message = await sendMessage(request.body.chatId, request.body.text, request.auth);
  emitMessageCreated({ chatId: request.body.chatId });
  sendSuccess(response, message, "Message sent.", 201);
});
