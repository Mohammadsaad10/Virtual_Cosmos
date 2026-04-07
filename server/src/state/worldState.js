/**
 * @typedef {{ x: number, y: number }} Position
 */

/**
 * @typedef {Object} WorldUser
 * @property {string} userId - Stable user identity.
 * @property {string} name - Display name shown in the cosmos.
 * @property {string} avatarColor - Avatar color token.
 * @property {Position} position - Current world coordinates.
 * @property {string} socketId - Active socket bound to the user.
 * @property {number} lastSeq - Last accepted movement sequence.
 */

/**
 * Creates an isolated in-memory world state container.
 *
 * @returns {{
 *   users: Map<string, WorldUser>,
 *   socketToUser: Map<string, string>,
 *   activeEdges: Set<string>,
 *   userRooms: Map<string, Set<string>>
 * }} Runtime world state.
 */
function createWorldState() {
  return {
    users: new Map(),
    socketToUser: new Map(),
    activeEdges: new Set(),
    userRooms: new Map(),
  };
}

/**
 * Produces deterministic edge key for pair-based proximity tracking.
 *
 * @param {string} userAId - First user identifier.
 * @param {string} userBId - Second user identifier.
 * @returns {string} Deterministic edge key.
 */
function computeEdgeKey(userAId, userBId) {
  return [userAId, userBId].sort().join("|");
}

/**
 * Upserts a user session and binds it to a socket.
 *
 * @param {ReturnType<typeof createWorldState>} state - Mutable world state.
 * @param {{ userId: string, name: string, avatarColor: string, position: Position, socketId: string }} input - Join payload.
 * @returns {WorldUser} Upserted user object.
 */
function upsertUser(state, input) {
  const existing = state.users.get(input.userId);

  if (existing && existing.socketId !== input.socketId) {
    state.socketToUser.delete(existing.socketId);
  }

  /** @type {WorldUser} */
  const nextUser = {
    userId: input.userId,
    name: input.name,
    avatarColor: input.avatarColor,
    position: input.position,
    socketId: input.socketId,
    lastSeq: existing?.lastSeq ?? 0,
  };

  state.users.set(input.userId, nextUser);
  state.socketToUser.set(input.socketId, input.userId);

  if (!state.userRooms.has(input.userId)) {
    state.userRooms.set(input.userId, new Set());
  }

  return nextUser;
}

/**
 * Applies movement update with monotonic sequence protection.
 *
 * @param {ReturnType<typeof createWorldState>} state - Mutable world state.
 * @param {{ userId: string, position: Position, seq?: number }} input - Move payload.
 * @returns {boolean} True when movement was accepted.
 */
function updateUserPosition(state, input) {
  const user = state.users.get(input.userId);
  if (!user) {
    return false;
  }

  const seq = Number.isFinite(input.seq) ? Number(input.seq) : user.lastSeq + 1;
  if (seq < user.lastSeq) {
    return false;
  }

  user.position = input.position;
  user.lastSeq = seq;
  return true;
}

/**
 * Registers a room membership for both users.
 *
 * @param {ReturnType<typeof createWorldState>} state - Mutable world state.
 * @param {string} userAId - First user identifier.
 * @param {string} userBId - Second user identifier.
 * @param {string} roomId - Pair room identifier.
 */
function registerRoomPair(state, userAId, userBId, roomId) {
  ensureUserRoomSet(state, userAId).add(roomId);
  ensureUserRoomSet(state, userBId).add(roomId);
}

/**
 * Unregisters room membership from both users.
 *
 * @param {ReturnType<typeof createWorldState>} state - Mutable world state.
 * @param {string} userAId - First user identifier.
 * @param {string} userBId - Second user identifier.
 * @param {string} roomId - Pair room identifier.
 */
function unregisterRoomPair(state, userAId, userBId, roomId) {
  ensureUserRoomSet(state, userAId).delete(roomId);
  ensureUserRoomSet(state, userBId).delete(roomId);
}

/**
 * Determines whether a user is currently tracked as part of a room.
 *
 * @param {ReturnType<typeof createWorldState>} state - Mutable world state.
 * @param {string} userId - User identifier.
 * @param {string} roomId - Room identifier.
 * @returns {boolean} Membership status.
 */
function isUserInRoom(state, userId, roomId) {
  return ensureUserRoomSet(state, userId).has(roomId);
}

/**
 * Removes a user by socket and cleans all pair edges touching that user.
 *
 * @param {ReturnType<typeof createWorldState>} state - Mutable world state.
 * @param {string} socketId - Disconnected socket ID.
 * @returns {{ removedUserId: string | null, removedConnections: Array<{ peerUserId: string, roomId: string }> }} Cleanup details.
 */
function removeUserBySocket(state, socketId) {
  const userId = state.socketToUser.get(socketId);
  if (!userId) {
    return { removedUserId: null, removedConnections: [] };
  }

  const removedConnections = [];
  for (const edgeKey of state.activeEdges) {
    const [left, right] = edgeKey.split("|");
    if (left !== userId && right !== userId) {
      continue;
    }

    const peerUserId = left === userId ? right : left;
    const roomId = `dm:${[userId, peerUserId].sort().join(":")}`;
    removedConnections.push({ peerUserId, roomId });

    state.activeEdges.delete(edgeKey);
    unregisterRoomPair(state, userId, peerUserId, roomId);
  }

  state.userRooms.delete(userId);
  state.socketToUser.delete(socketId);
  state.users.delete(userId);

  return { removedUserId: userId, removedConnections };
}

/**
 * Serializes world users for outbound socket payloads.
 *
 * @param {ReturnType<typeof createWorldState>} state - Mutable world state.
 * @returns {Array<{ userId: string, name: string, avatarColor: string, position: Position }>} User snapshot.
 */
function listPublicUsers(state) {
  return Array.from(state.users.values(), (user) => ({
    userId: user.userId,
    name: user.name,
    avatarColor: user.avatarColor,
    position: user.position,
  }));
}

/**
 * @param {ReturnType<typeof createWorldState>} state
 * @param {string} userId
 * @returns {WorldUser | undefined}
 */
function getUserById(state, userId) {
  return state.users.get(userId);
}

/**
 * @param {ReturnType<typeof createWorldState>} state
 * @param {string} socketId
 * @returns {WorldUser | undefined}
 */
function getUserBySocketId(state, socketId) {
  const userId = state.socketToUser.get(socketId);
  return userId ? state.users.get(userId) : undefined;
}

/**
 * Ensures a room set exists for the provided user.
 *
 * @param {ReturnType<typeof createWorldState>} state - Mutable world state.
 * @param {string} userId - User identifier.
 * @returns {Set<string>} Existing or newly created room set.
 */
function ensureUserRoomSet(state, userId) {
  if (!state.userRooms.has(userId)) {
    state.userRooms.set(userId, new Set());
  }
  return state.userRooms.get(userId);
}

export {
  createWorldState,
  computeEdgeKey,
  upsertUser,
  updateUserPosition,
  registerRoomPair,
  unregisterRoomPair,
  isUserInRoom,
  removeUserBySocket,
  listPublicUsers,
  getUserById,
  getUserBySocketId,
};
