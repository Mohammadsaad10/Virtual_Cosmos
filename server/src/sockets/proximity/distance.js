/**
 * Calculates Euclidean distance between two world coordinates.
 *
 * @param {{ x: number, y: number }} left - First point.
 * @param {{ x: number, y: number }} right - Second point.
 * @returns {number} Distance in world units.
 */
function getEuclideanDistance(left, right) {
  const dx = left.x - right.x;
  const dy = left.y - right.y;
  return Math.sqrt((dx * dx) + (dy * dy));
}

export { getEuclideanDistance };
