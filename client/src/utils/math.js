/**
 * Clamps a value into a fixed inclusive range.
 *
 * @param {number} value - Candidate value.
 * @param {number} min - Inclusive lower bound.
 * @param {number} max - Inclusive upper bound.
 * @returns {number} Clamped value.
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Computes Euclidean distance between two points.
 *
 * @param {{ x: number, y: number }} left - First point.
 * @param {{ x: number, y: number }} right - Second point.
 * @returns {number} Distance in world units.
 */
export function getDistance(left, right) {
  const dx = left.x - right.x;
  const dy = left.y - right.y;
  return Math.sqrt(dx * dx + dy * dy);
}
