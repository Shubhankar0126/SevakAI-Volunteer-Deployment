import { createMessageEntry, listChatsForUser, listMessagesForChat } from "./data-store.service.js";

export async function getChats(userContext) {
  return listChatsForUser(userContext);
}

export async function getMessages(chatId) {
  return listMessagesForChat(chatId);
}

export async function sendMessage(chatId, text, userContext) {
  return createMessageEntry({
    chatId,
    senderId: userContext.user.id,
    text,
  });
}
