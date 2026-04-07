import Message from "../../models/Message.js";
import { getUserBySocketId, isUserInRoom } from "../../state/worldState.js";
import { isMongoConnected } from "../../db/mongoose.js";

/**
 * Handles outbound chat messages for valid proximity rooms.
 *
 * @param {import("socket.io").Socket} socket - Current socket.
 * @param {{ roomId?: string, text?: string }} payload - Outbound chat payload.
 * @param {{
 *   io: import("socket.io").Server,
 *   state: ReturnType<import("../../state/worldState").createWorldState>
 * }} context - Shared runtime dependencies.
 */
function handleSendMessage(socket, payload, context) {
  const { io, state } = context;

  const sender = getUserBySocketId(state, socket.id);
  if (!sender) {
    return;
  }

  const roomId = String(payload?.roomId || "").trim();
  const text = String(payload?.text || "").trim();

  if (!roomId || !text || text.length > 400) {
    return;
  }

  if (!isUserInRoom(state, sender.userId, roomId)) {
    return;
  }

  const messagePayload = {
    roomId,
    fromUserId: sender.userId,
    text,
    msgId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    ts: Date.now(),
  };

  io.to(roomId).emit("receive_message", messagePayload);

  if (isMongoConnected()) {
    Message.create({
      roomId,
      fromUserId: sender.userId,
      text,
    }).catch(() => null);
  }
}

export { handleSendMessage };
