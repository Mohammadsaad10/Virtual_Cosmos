import User from "../../models/User.js";
import { removeUserBySocket, getUserById } from "../../state/worldState.js";
import { broadcastUsersUpdate } from "../shared.js";
import { isMongoConnected } from "../../db/mongoose.js";

/**
 * Handles socket disconnect cleanup for world state and peer notifications.
 *
 * @param {import("socket.io").Socket} socket - Disconnected socket.
 * @param {string} reason - Socket.IO disconnect reason.
 * @param {{
 *   io: import("socket.io").Server,
 *   state: ReturnType<import("../../state/worldState").createWorldState>
 * }} context - Shared runtime dependencies.
 */
function handleDisconnect(socket, reason, context) {
  const { io, state } = context;

  const cleanup = removeUserBySocket(state, socket.id);
  if (!cleanup.removedUserId) {
    return;
  }

  const disconnectedAt = Date.now();

  for (const connection of cleanup.removedConnections) {
    const peer = getUserById(state, connection.peerUserId);
    if (!peer) {
      continue;
    }

    io.sockets.sockets.get(peer.socketId)?.leave(connection.roomId);
    io.to(peer.socketId).emit("proximity_disconnect", {
      roomId: connection.roomId,
      peerUserId: cleanup.removedUserId,
      reason: reason || "socket_disconnect",
      disconnectedAt,
    });
  }

  if (isMongoConnected()) {
    User.findOneAndUpdate(
      { userId: cleanup.removedUserId },
      { lastSeenAt: new Date() },
    ).catch(() => null);
  }

  broadcastUsersUpdate(io, state);
}

export { handleDisconnect };
