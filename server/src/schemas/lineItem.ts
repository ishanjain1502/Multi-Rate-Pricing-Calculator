import { z } from "zod";

const discountItemSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("percent"), value: z.number().min(0) }),
  z.object({ type: z.literal("fixed"), value: z.number().int().min(0) }),
]);

export const discountSchema = z.array(discountItemSchema).max(1);

export const createLineSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().int().min(1),
  unitPrice: z.number().int().min(0),
  discounts: discountSchema.optional().default([]),
  taxPercent: z.number().min(0).max(100),
});

export const updateLineSchema = z
  .object({
    description: z.string().min(1).max(500).optional(),
    quantity: z.number().int().min(1).optional(),
    unitPrice: z.number().int().min(0).optional(),
    discounts: discountSchema.optional(),
    taxPercent: z.number().min(0).max(100).optional(),
  })
  .strict();

