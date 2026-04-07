import { useContext } from "react";
import { WorldContext } from "./worldContext";

/**
 * Reads world context. Must be used under WorldProvider.
 *
 * @returns {{
 *   session: { userId: string, name: string, avatarColor: string },
 *   users: Array<{ userId: string, name: string, avatarColor: string, position: { x: number, y: number } }>,
 *   selfUser: { userId: string, name: string, avatarColor: string, position: { x: number, y: number } } | null,
 *   activeRooms: Array<{ roomId: string, peerUserId: string, peerName: string, distance: number }>,
 *   selectedRoomId: string | null,
 *   selectedMessages: Array<{ roomId: string, fromUserId: string, text: string, ts: number, msgId?: string }>,
 *   worldConfig: { width: number, height: number, proximityRadius: number },
 *   connectionStatus: string,
 *   sendMessage: (roomId: string, text: string) => void,
 *   selectRoom: (roomId: string) => void
 * }} World context.
 */
export function useWorld() {
  const context = useContext(WorldContext);
  if (!context) {
    throw new Error("useWorld must be used inside WorldProvider");
  }

  return context;
}
