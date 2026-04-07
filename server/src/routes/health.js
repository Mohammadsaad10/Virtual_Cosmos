import express from "express";

const healthRouter = express.Router();

/**
 * Liveness endpoint for local development and deployment checks.
 */
healthRouter.get("/", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

export default healthRouter;
