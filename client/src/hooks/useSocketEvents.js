import { useEffect } from "react";

/**
 * Registers multiple socket event handlers with automatic cleanup.
 *
 * @param {import("socket.io-client").Socket | null} socket - Socket client instance.
 * @param {Record<string, (...args: unknown[]) => void>} handlers - Event map keyed by event name.
 */
export function useSocketEvents(socket, handlers) {
  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const entries = Object.entries(handlers);
    for (const [eventName, handler] of entries) {
      socket.on(eventName, handler);
    }

    return () => {
      for (const [eventName, handler] of entries) {
        socket.off(eventName, handler);
      }
    };
  }, [socket, handlers]);
}
