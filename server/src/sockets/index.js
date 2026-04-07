import { handleJoin } from "./handlers/joinHandler.js";
import { handleMove } from "./handlers/moveHandler.js";
import { handleSendMessage } from "./handlers/chatHandler.js";
import { handleDisconnect } from "./handlers/disconnectHandler.js";

/**
 * Registers all Socket.IO event handlers.
 *
 * @param {import("socket.io").Server} io - Socket.IO server instance.
 * @param {ReturnType<import("../state/worldState").createWorldState>} state - Runtime world state.
 * @param {{ worldWidth: number, worldHeight: number, proximityRadius: number }} config - Runtime config subset.
 */
function registerSocketHandlers(io, state, config) {
  const context = { io, state, config };

  io.on("connection", (socket) => {
    socket.on("join", (payload) => {
      handleJoin(socket, payload, context).catch(() => null);
    });

    socket.on("move", (payload) => {
      handleMove(socket, payload, context);
    });

    socket.on("send_message", (payload) => {
      handleSendMessage(socket, payload, context);
    });

    socket.on("disconnect", (reason) => {
      handleDisconnect(socket, reason, context);
    });
  });
}

export { registerSocketHandlers };
