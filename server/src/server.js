import http from "node:http";
import { Server as SocketIOServer } from "socket.io";

import env from "./config/env.js";
import { connectToMongo } from "./db/mongoose.js";
import { createApp } from "./app.js";
import { createWorldState } from "./state/worldState.js";
import { registerSocketHandlers } from "./sockets/index.js";

/**
 * Boots HTTP + Socket.IO infrastructure for the Virtual Cosmos backend.
 */
async function bootstrap() {
  await connectToMongo(env.mongoUri);

  const app = createApp(env);
  const httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.clientOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const worldState = createWorldState();
  registerSocketHandlers(io, worldState, env);

  httpServer.listen(env.port, () => {
    console.info(`[server] listening on :${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("[server] failed to boot", error);
  process.exit(1);
});
