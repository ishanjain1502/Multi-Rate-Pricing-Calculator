import "dotenv/config";
import type { Server } from "http";
import mongoose from "mongoose";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

let server: Server | undefined;
let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`${signal} received, shutting down gracefully...`);

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => (err ? reject(err) : resolve()));
      });
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    console.log("Shutdown complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
}

async function start(): Promise<void> {
  await connectDB();

  server = app.listen(env.port, () => {
    console.log(`Server listening on http://localhost:${env.port}`);
  });

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
