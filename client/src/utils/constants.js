/**
 * Shared client constants for world dimensions, movement, and networking.
 */
export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || "http://localhost:4000";
export const WORLD_WIDTH = 1600;
export const WORLD_HEIGHT = 900;
export const PROXIMITY_RADIUS = 120;
export const PLAYER_SPEED = 260;
export const MOVEMENT_EMIT_INTERVAL_MS = 66;
