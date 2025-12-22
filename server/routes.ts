import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // The Pepper scorekeeping app uses client-side localStorage for persistence
  // No API routes needed - all game state is managed in the browser

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "pepper-scorekeeper" });
  });

  return httpServer;
}
