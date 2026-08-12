import { afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

let mongoReplSet: MongoMemoryReplSet;

beforeEach(async () => {
  mongoReplSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoReplSet.waitUntilRunning();
  const baseUri = mongoReplSet.getUri();
  const uri = baseUri.includes("?") ? `${baseUri}&retryWrites=false` : `${baseUri}?retryWrites=false`;
  await mongoose.connect(uri, { retryWrites: false });
});

afterEach(async () => {
  await mongoose.disconnect();
  await mongoReplSet.stop();
});
