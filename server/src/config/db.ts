import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB(): Promise<void> {
  if (!env.mongoUri) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }

  try {
    await mongoose.connect(env.mongoUri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}
