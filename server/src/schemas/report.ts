import { z } from "zod";

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use yyyy-mm-dd");

const currencySchema = z.string().min(3).max(3).toLowerCase();

const ratesSchema = z.record(z.string().min(3).max(3).toLowerCase(), z.number().positive());

export const reportSetupQuerySchema = z.object({
  from: dateStringSchema,
  to: dateStringSchema,
  targetCurrency: currencySchema.default("usd"),
});

export const summaryReportSchema = z
  .object({
    from: dateStringSchema,
    to: dateStringSchema,
    targetCurrency: currencySchema.default("usd"),
    rates: ratesSchema,
  })
  .superRefine((data, ctx) => {
    if (data.from > data.to) {
      ctx.addIssue({
        code: "custom",
        message: "from must be on or before to",
        path: ["from"],
      });
    }
  });
