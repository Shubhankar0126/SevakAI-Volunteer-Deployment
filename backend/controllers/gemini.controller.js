import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess } from "../utils/response.js";
import { askOperationsAssistant } from "../services/gemini.service.js";

export const askAssistant = asyncHandler(async (request, response) => {
  sendSuccess(
    response,
    await askOperationsAssistant(request.body.question, request.auth),
    "Assistant response generated.",
  );
});
