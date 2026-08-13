import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../dist/app.js";
import { connectDB } from "../dist/config/db.js";

let booted: Promise<void> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!booted) booted = connectDB();
  await booted;
  app(req, res);
}
