import mongoose from "mongoose";
import { env } from "./env.js";

type MongooseCache = {
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.__mongooseCache ?? { promise: null };
if (!global.__mongooseCache) global.__mongooseCache = cache;

export async function connectDB(): Promise<void> {
  if (!env.mongoUri) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(env.mongoUri).then(async (m) => {
      const hello = await m.connection.db!.admin().command({ hello: 1 });
      if (!hello.setName) {
        console.warn(
          "WARNING: MongoDB is not a replica set. Transactions (line mutations, document delete, finalize) require a replica set URI. See .env.example.",
        );
      }
      console.log("MongoDB connected");
      return m;
    });
  }

  try {
    await cache.promise;
  } catch (error) {
    cache.promise = null;
    console.error("MongoDB connection error:", error);
    throw error;
  }
}
