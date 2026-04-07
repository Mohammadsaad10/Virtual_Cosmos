import { io } from "socket.io-client";
import { SERVER_URL } from "../utils/constants";

let socketInstance = null;

/**
 * Returns a singleton Socket.IO client used across providers and hooks.
 *
 * @returns {import("socket.io-client").Socket} Socket client instance.
 */
export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SERVER_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }

  return socketInstance;
}
