/**
 * Builds a deterministic room id for a direct proximity pair.
 *
 * @param {string} userAId - First user id.
 * @param {string} userBId - Second user id.
 * @returns {string} Pair room id.
 */
function createPairRoomId(userAId, userBId) {
  return `dm:${[userAId, userBId].sort().join(":")}`;
}

export { createPairRoomId };
