import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    fromUserId: {
      type: String,
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 400,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

messageSchema.index({ roomId: 1, createdAt: -1 });

export default mongoose.models.Message || mongoose.model("Message", messageSchema);
