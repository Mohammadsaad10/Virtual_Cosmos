import { updateUserPosition } from "../../state/worldState.js";
import { evaluateProximityForUser } from "../proximity/proximityEngine.js";
import {
  broadcastUsersUpdate,
  emitProximityConnect,
  emitProximityDisconnect,
} from "../shared.js";

/**
 * Bounds a numeric value between inclusive min and max.
 *
 * @param {number} value - Candidate numeric value.
 * @param {number} min - Inclusive lower bound.
 * @param {number} max - Inclusive upper bound.
 * @returns {number} Clamped numeric result.
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Processes position updates and emits room connect/disconnect diffs.
 *
 * @param {import("socket.io").Socket} socket - Current socket.
 * @param {{ userId?: string, position?: { x?: number, y?: number }, seq?: number }} payload - Movement payload.
 * @param {{
 *   io: import("socket.io").Server,
 *   state: ReturnType<import("../../state/worldState").createWorldState>,
 *   config: { worldWidth: number, worldHeight: number, proximityRadius: number }
 * }} context - Shared runtime dependencies.
 */
function handleMove(socket, payload, context) {
  const { io, state, config } = context;

  const userId = String(payload?.userId || "").trim();
  const rawX = Number(payload?.position?.x);
  const rawY = Number(payload?.position?.y);

  if (!userId || !Number.isFinite(rawX) || !Number.isFinite(rawY)) {
    return;
  }

  const accepted = updateUserPosition(state, {
    userId,
    position: {
      x: clamp(rawX, 0, config.worldWidth),
      y: clamp(rawY, 0, config.worldHeight),
    },
    seq: Number.isFinite(payload?.seq) ? Number(payload.seq) : undefined,
  });

  if (!accepted) {
    return;
  }

  const proximityDiff = evaluateProximityForUser(
    state,
    userId,
    config.proximityRadius,
  );

  for (const connectEvent of proximityDiff.connects) {
    emitProximityConnect(io, state, connectEvent);
  }

  for (const disconnectEvent of proximityDiff.disconnects) {
    emitProximityDisconnect(io, state, disconnectEvent);
  }

  broadcastUsersUpdate(io, state);
}

export { handleMove };
