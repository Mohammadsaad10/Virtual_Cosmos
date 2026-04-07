import cors from "cors";
import express from "express";

import healthRouter from "./routes/health.js";

/**
 * Creates configured Express app used by HTTP and Socket.IO servers.
 *
 * @param {{ clientOrigin: string }} config - Runtime app config.
 * @returns {import("express").Express} Configured app instance.
 */
function createApp(config) {
  const app = express();

  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true,
    }),
  );
  app.use(express.json());

  app.use("/health", healthRouter);

  return app;
}

export { createApp };
