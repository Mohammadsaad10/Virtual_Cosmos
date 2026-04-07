import { useMemo } from "react";

/**
 * Produces proximity availability flags used by layout components.
 *
 * @param {Array<{ roomId: string }>} activeRooms - Active proximity rooms.
 * @returns {{ hasConnections: boolean, activeCount: number }} Derived proximity status.
 */
export function useProximityStatus(activeRooms) {
  return useMemo(() => {
    const activeCount = activeRooms.length;
    return {
      hasConnections: activeCount > 0,
      activeCount,
    };
  }, [activeRooms]);
}
