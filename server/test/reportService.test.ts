import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { Document } from "../src/models/index.js";
import {
  generateSummaryReport,
  getReportSetup,
  currenciesInRange,
} from "../src/services/reportService.js";
import { ValidationError } from "../src/errors/HttpError.js";

const userId = new mongoose.Types.ObjectId().toString();

async function seedFinalized(
  overrides: {
    currency?: string;
    issueDate?: Date;
    grandTotal?: number;
    totalTax?: number;
    totalDiscount?: number;
    status?: "draft" | "finalized";
  } = {},
) {
  return Document.create({
    userId,
    title: "Report doc",
    customer: "",
    issueDate: overrides.issueDate ?? new Date("2026-06-15T12:00:00.000Z"),
    status: overrides.status ?? "finalized",
    currency: overrides.currency ?? "usd",
    subtotal: overrides.grandTotal ?? 10000,
    totalDiscount: overrides.totalDiscount ?? 0,
    totalTax: overrides.totalTax ?? 500,
    grandTotal: overrides.grandTotal ?? 10000,
  });
}

describe("reportService", () => {
  it("aggregates finalized docs in date range only", async () => {
    await seedFinalized({ grandTotal: 10000, totalTax: 500, totalDiscount: 1000 });
    await seedFinalized({
      currency: "eur",
      grandTotal: 10000,
      totalTax: 200,
      totalDiscount: 0,
    });
    await seedFinalized({
      issueDate: new Date("2025-01-01"),
      grandTotal: 99999,
      status: "finalized",
    });
    await seedFinalized({ status: "draft", grandTotal: 50000 });

    const report = await generateSummaryReport(userId, {
      from: "2026-01-01",
      to: "2026-12-31",
      targetCurrency: "usd",
      rates: { eur: 1.08 },
    });

    expect(report.documentCount).toBe(2);
    expect(report.grandTotal).toBe(10000 + 10800);
    expect(report.totalTax).toBe(500 + 216);
    expect(report.totalDiscount).toBe(1000);
    expect(report.breakdown).toHaveLength(2);
  });

  it("getReportSetup returns currencies and default rates for target", async () => {
    await seedFinalized({ currency: "eur" });
    const setup = await getReportSetup(userId, "2026-01-01", "2026-12-31", "usd");
    expect(setup.currencies).toContain("eur");
    expect(setup.defaultRates.eur).toBe(1.08);
  });

  it("rejects missing exchange rate for document currency", async () => {
    await seedFinalized({ currency: "eur" });
    await expect(
      generateSummaryReport(userId, {
        from: "2026-01-01",
        to: "2026-12-31",
        targetCurrency: "usd",
        rates: {},
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("currenciesInRange excludes drafts and out-of-range docs", async () => {
    await seedFinalized({ currency: "gbp" });
    await seedFinalized({ currency: "eur", status: "draft" });
    const currencies = await currenciesInRange(userId, "2026-01-01", "2026-12-31");
    expect(currencies).toEqual(["gbp"]);
  });
});
