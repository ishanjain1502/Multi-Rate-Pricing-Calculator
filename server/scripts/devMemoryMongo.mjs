// Starts an ephemeral in-memory MongoDB replica set, then launches the API
// dev server with MONGO_URI pointed at it. The URI never leaves this process.
import { spawn } from "node:child_process";
import { MongoMemoryReplSet } from "mongodb-memory-server";

const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
const uri = replSet.getUri("crossval");
console.log("[dev-memory-mongo] in-memory replica set ready, starting API...");

const child = spawn("npx", ["tsx", "watch", "src/index.ts"], {
  stdio: "inherit",
  env: { ...process.env, MONGO_URI: uri },
  shell: process.platform === "win32",
});

async function shutdown() {
  child.kill();
  await replSet.stop();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
child.on("exit", (code) => {
  console.log(`[dev-memory-mongo] API exited with code ${code}`);
  shutdown();
});
