import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

async function start(): Promise<void> {
  await connectDB();

  app.listen(env.port, () => {
    console.log(`Server listening on http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
