import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  customer: z.string().max(200).optional(),
  issueDate: z.coerce.date(),
  currency: z.string().min(3).max(3).toLowerCase(),
});

export const updateDocumentSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    customer: z.string().max(200).optional(),
    issueDate: z.coerce.date().optional(),
    currency: z.string().min(3).max(3).toLowerCase().optional(),
    status: z.never().optional(),
  })
  .strict();

