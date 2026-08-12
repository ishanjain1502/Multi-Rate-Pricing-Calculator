import { z } from "zod";

export const idParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id"),
});

export const listQuerySchema = z.object({
  status: z.enum(["draft", "finalized"]).optional(),
});

export const lineIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id"),
  lineId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid lineId"),
});

