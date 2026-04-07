import dotenv from "dotenv";

dotenv.config();

/**
 * Parses an integer environment variable and falls back to a default value.
 *
 * @param {string | undefined} rawValue - Raw environment value.
 * @param {number} fallback - Default value used when parsing fails.
 * @returns {number} Parsed integer.
 */
function parseIntWithFallback(rawValue, fallback) {
  const parsed = Number.parseInt(rawValue ?? "", 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/**
 * Immutable runtime configuration used across API routes and socket handlers.
 */
const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseIntWithFallback(process.env.PORT, 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  mongoUri: process.env.MONGO_URI || "",
  worldWidth: parseIntWithFallback(process.env.WORLD_WIDTH, 1600),
  worldHeight: parseIntWithFallback(process.env.WORLD_HEIGHT, 900),
  proximityRadius: parseIntWithFallback(process.env.PROXIMITY_RADIUS, 120),
  movementThrottleMs: parseIntWithFallback(process.env.MOVEMENT_THROTTLE_MS, 66),
});

export default env;
