import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB(): Promise<void> {
  if (!env.mongoUri) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }

  try {
    await mongoose.connect(env.mongoUri);

    const hello = await mongoose.connection.db!.admin().command({ hello: 1 });
    if (!hello.setName) {
      console.warn(
        "WARNING: MongoDB is not a replica set. Transactions (line mutations, document delete, finalize) require a replica set URI. See .env.example.",
      );
    }

    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}
