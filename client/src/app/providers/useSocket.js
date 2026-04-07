import { useContext } from "react";
import { SocketContext } from "./socketContext";

/**
 * Reads socket context. Must be used under SocketProvider.
 *
 * @returns {{ socket: import("socket.io-client").Socket, connectionStatus: string, isConnected: boolean }} Socket context value.
 */
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used inside SocketProvider");
  }

  return context;
}
