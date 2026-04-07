import { getEuclideanDistance } from "./distance.js";
import { createPairRoomId } from "./roomId.js";
import {
  computeEdgeKey,
  registerRoomPair,
  unregisterRoomPair,
  getUserById,
} from "../../state/worldState.js";

/**
 * Re-evaluates proximity links for a moved user and returns edge diff events.
 *
 * @param {import("../../state/worldState").createWorldState extends (...args: any) => infer T ? T : never} state - Mutable world state.
 * @param {string} movedUserId - User id that triggered evaluation.
 * @param {number} proximityRadius - Connection radius in world units.
 * @returns {{
 *   connects: Array<{ userAId: string, userBId: string, roomId: string, distance: number }>,
 *   disconnects: Array<{ userAId: string, userBId: string, roomId: string, reason: string }>
 * }} Proximity edge diff.
 */
function evaluateProximityForUser(state, movedUserId, proximityRadius) {
  const movedUser = getUserById(state, movedUserId);
  if (!movedUser) {
    return { connects: [], disconnects: [] };
  }

  const connects = [];
  const disconnects = [];

  for (const [otherUserId, otherUser] of state.users.entries()) {
    if (otherUserId === movedUserId) {
      continue;
    }

    const edgeKey = computeEdgeKey(movedUserId, otherUserId);
    const roomId = createPairRoomId(movedUserId, otherUserId);
    const distance = getEuclideanDistance(movedUser.position, otherUser.position);
    const isConnected = distance < proximityRadius;
    const wasConnected = state.activeEdges.has(edgeKey);

    if (isConnected && !wasConnected) {
      state.activeEdges.add(edgeKey);
      registerRoomPair(state, movedUserId, otherUserId, roomId);
      connects.push({
        userAId: movedUserId,
        userBId: otherUserId,
        roomId,
        distance,
      });
      continue;
    }

    if (!isConnected && wasConnected) {
      state.activeEdges.delete(edgeKey);
      unregisterRoomPair(state, movedUserId, otherUserId, roomId);
      disconnects.push({
        userAId: movedUserId,
        userBId: otherUserId,
        roomId,
        reason: "out_of_range",
      });
    }
  }

  return { connects, disconnects };
}

export { evaluateProximityForUser };
