import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, required: true, trim: true, minlength: 1, maxlength: 4000 },
  },
  { timestamps: true },
);

messageSchema.index({ chatId: 1, createdAt: 1 });

export const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);
