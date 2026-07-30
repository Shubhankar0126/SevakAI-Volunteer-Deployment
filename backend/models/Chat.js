import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    participantIds: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
    scope: { type: String, default: "ops", trim: true, maxlength: 50, index: true },
  },
  { timestamps: true },
);

chatSchema.index({ participantIds: 1 });
chatSchema.index({ scope: 1, updatedAt: -1 });

export const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);
