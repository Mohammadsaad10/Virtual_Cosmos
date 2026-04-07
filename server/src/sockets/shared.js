import { getUserById, listPublicUsers } from "../state/worldState.js";

/**
 * Emits a full world user snapshot to all connected clients.
 *
 * @param {import("socket.io").Server} io - Socket server.
 * @param {ReturnType<import("../state/worldState").createWorldState>} state - Runtime world state.
 */
function broadcastUsersUpdate(io, state) {
  io.emit("users_update", {
    users: listPublicUsers(state),
    ts: Date.now(),
  });
}

/**
 * Emits pair connect event and synchronizes room membership for both users.
 *
 * @param {import("socket.io").Server} io - Socket server.
 * @param {ReturnType<import("../state/worldState").createWorldState>} state - Runtime world state.
 * @param {{ userAId: string, userBId: string, roomId: string, distance: number }} event - Connect event payload.
 */
function emitProximityConnect(io, state, event) {
  const userA = getUserById(state, event.userAId);
  const userB = getUserById(state, event.userBId);
  if (!userA || !userB) {
    return;
  }

  const socketA = io.sockets.sockets.get(userA.socketId);
  const socketB = io.sockets.sockets.get(userB.socketId);

  socketA?.join(event.roomId);
  socketB?.join(event.roomId);

  io.to(userA.socketId).emit("proximity_connect", {
    roomId: event.roomId,
    peerUserId: userB.userId,
    peerName: userB.name,
    distance: Number(event.distance.toFixed(2)),
    connectedAt: Date.now(),
  });

  io.to(userB.socketId).emit("proximity_connect", {
    roomId: event.roomId,
    peerUserId: userA.userId,
    peerName: userA.name,
    distance: Number(event.distance.toFixed(2)),
    connectedAt: Date.now(),
  });
}

/**
 * Emits pair disconnect event and removes room membership for both users.
 *
 * @param {import("socket.io").Server} io - Socket server.
 * @param {ReturnType<import("../state/worldState").createWorldState>} state - Runtime world state.
 * @param {{ userAId: string, userBId: string, roomId: string, reason: string }} event - Disconnect event payload.
 */
function emitProximityDisconnect(io, state, event) {
  const userA = getUserById(state, event.userAId);
  const userB = getUserById(state, event.userBId);

  const disconnectedAt = Date.now();

  if (userA) {
    io.sockets.sockets.get(userA.socketId)?.leave(event.roomId);
    io.to(userA.socketId).emit("proximity_disconnect", {
      roomId: event.roomId,
      peerUserId: event.userBId,
      reason: event.reason,
      disconnectedAt,
    });
  }

  if (userB) {
    io.sockets.sockets.get(userB.socketId)?.leave(event.roomId);
    io.to(userB.socketId).emit("proximity_disconnect", {
      roomId: event.roomId,
      peerUserId: event.userAId,
      reason: event.reason,
      disconnectedAt,
    });
  }
}

export { broadcastUsersUpdate, emitProximityConnect, emitProximityDisconnect };
