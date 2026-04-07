import User from "../../models/User.js";
import { upsertUser } from "../../state/worldState.js";
import { evaluateProximityForUser } from "../proximity/proximityEngine.js";
import {
  broadcastUsersUpdate,
  emitProximityConnect,
  emitProximityDisconnect,
} from "../shared.js";
import { isMongoConnected } from "../../db/mongoose.js";

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
 * Handles initial user join handshake and world registration.
 *
 * @param {import("socket.io").Socket} socket - Current client socket.
 * @param {{ userId?: string, name?: string, avatarColor?: string, position?: { x?: number, y?: number } }} payload - Join payload.
 * @param {{
 *   io: import("socket.io").Server,
 *   state: ReturnType<import("../../state/worldState").createWorldState>,
 *   config: { worldWidth: number, worldHeight: number, proximityRadius: number }
 * }} context - Shared runtime dependencies.
 */
async function handleJoin(socket, payload, context) {
  const { io, state, config } = context;

  const userId = String(payload?.userId || "").trim();
  const name = String(payload?.name || "").trim();

  if (!userId || !name) {
    return;
  }

  const avatarColor = String(payload?.avatarColor || "#5eead4").trim();
  const rawX = Number(
    payload?.position?.x ?? Math.round(config.worldWidth / 2),
  );
  const rawY = Number(
    payload?.position?.y ?? Math.round(config.worldHeight / 2),
  );

  const position = {
    x: clamp(rawX, 0, config.worldWidth),
    y: clamp(rawY, 0, config.worldHeight),
  };

  upsertUser(state, {
    userId,
    name,
    avatarColor,
    position,
    socketId: socket.id,
  });

  if (isMongoConnected()) {
    User.findOneAndUpdate(
      { userId },
      {
        userId,
        name,
        avatarColor,
        lastSeenAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).catch(() => null);
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

export { handleJoin };
