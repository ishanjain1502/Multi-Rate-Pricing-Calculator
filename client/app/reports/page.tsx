"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { getReportSetup, postSummaryReport } from "@/lib/api";
import { CURRENCIES, formatMoney } from "@/lib/money";
import { downloadSummaryReportPdf } from "@/lib/reportPdf";
import { ApiError, type SummaryReport } from "@/lib/types";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function ReportPage() {
  const { logout } = useAuth();
  const router = useRouter();
  const [from, setFrom] = useState(() => `${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(todayIso);
  const [targetCurrency, setTargetCurrency] = useState("usd");
  const [rates, setRates] = useState<Record<string, string>>({});
  const [neededCurrencies, setNeededCurrencies] = useState<string[]>([]);
  const [report, setReport] = useState<SummaryReport | null>(null);
  const [appliedRates, setAppliedRates] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [loadingSetup, setLoadingSetup] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);

  const loadSetup = useCallback(async () => {
    if (!from || !to || from > to) return;
    setLoadingSetup(true);
    setError(null);
    try {
      const setup = await getReportSetup(from, to, targetCurrency);
      const needed = setup.currencies.filter((c) => c !== setup.targetCurrency);
      setNeededCurrencies(needed);
      const nextRates: Record<string, string> = {};
      for (const c of needed) {
        const defaultRate = setup.defaultRates[c];
        nextRates[c] = defaultRate !== undefined ? String(defaultRate) : "";
      }
      setRates(nextRates);
      setReport(null);
      setAppliedRates({});
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load report setup");
    } finally {
      setLoadingSetup(false);
    }
  }, [from, to, targetCurrency]);

  useEffect(() => {
    loadSetup();
  }, [loadSetup]);

  async function onGenerate() {
    if (from > to) {
      setError("Start date must be on or before end date");
      return;
    }
    const parsedRates: Record<string, number> = {};
    for (const c of neededCurrencies) {
      const raw = rates[c]?.trim();
      if (!raw) {
        setError(`Enter an exchange rate for ${c.toUpperCase()}`);
        return;
      }
      const n = Number(raw);
      if (!Number.isFinite(n) || n <= 0) {
        setError(`Invalid rate for ${c.toUpperCase()}`);
        return;
      }
      parsedRates[c] = n;
    }
    setLoadingReport(true);
    setError(null);
    try {
      const result = await postSummaryReport({
        from,
        to,
        targetCurrency,
        rates: parsedRates,
      });
      setReport(result);
      setAppliedRates(parsedRates);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to generate report");
    } finally {
      setLoadingReport(false);
    }
  }

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Summary report</h1>
          <p className="text-sm text-zinc-500">Finalized documents by issue date</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => router.push("/documents")}
            className="rounded border border-zinc-300 px-4 py-2 text-sm"
          >
            Documents
          </button>
          <button onClick={onLogout} className="rounded border border-zinc-300 px-4 py-2 text-sm">
            Log out
          </button>
        </div>
      </header>

      <section className="mb-6 space-y-4 rounded-lg border border-zinc-200 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-zinc-600">From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-600">To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="text-zinc-600">Report currency</span>
          <select
            value={targetCurrency}
            onChange={(e) => setTargetCurrency(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label} ({c.code.toUpperCase()})
              </option>
            ))}
          </select>
        </label>

        {loadingSetup && <p className="text-sm text-zinc-500">Loading exchange rates…</p>}

        {neededCurrencies.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-700">Exchange rates to {targetCurrency.toUpperCase()}</p>
            <p className="text-xs text-zinc-500">
              1 unit of source currency equals this many units of {targetCurrency.toUpperCase()}. Amounts convert in
              cents and round to the nearest cent.
            </p>
            {neededCurrencies.map((c) => (
              <label key={c} className="flex items-center gap-3 text-sm">
                <span className="w-12 font-medium uppercase">{c}</span>
                <span className="text-zinc-500">→ {targetCurrency.toUpperCase()}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={rates[c] ?? ""}
                  onChange={(e) => setRates((prev) => ({ ...prev, [c]: e.target.value }))}
                  className="w-32 rounded border border-zinc-300 px-3 py-2"
                  placeholder="1.08"
                />
              </label>
            ))}
          </div>
        )}

        {neededCurrencies.length === 0 && !loadingSetup && (
          <p className="text-sm text-zinc-500">
            No foreign currencies in this range — totals use {targetCurrency.toUpperCase()} directly.
          </p>
        )}

        <button
          onClick={onGenerate}
          disabled={loadingReport || loadingSetup}
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loadingReport ? "Generating…" : "Generate report"}
        </button>
      </section>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {report && (
        <section className="rounded-lg border border-zinc-200 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-medium">
              {report.from} — {report.to} ({report.targetCurrency.toUpperCase()})
            </h2>
            <button
              type="button"
              onClick={() => downloadSummaryReportPdf(report, { rates: appliedRates })}
              className="rounded border border-zinc-300 px-4 py-2 text-sm hover:border-zinc-400"
            >
              Download PDF
            </button>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-zinc-500">Documents</dt>
              <dd className="text-xl font-semibold">{report.documentCount}</dd>
            </div>
            <div>
              <dt className="text-sm text-zinc-500">Grand total</dt>
              <dd className="text-xl font-semibold">
                {formatMoney(report.grandTotal, report.targetCurrency)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-zinc-500">Total tax</dt>
              <dd className="text-xl font-semibold">
                {formatMoney(report.totalTax, report.targetCurrency)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-zinc-500">Total discount</dt>
              <dd className="text-xl font-semibold">
                {formatMoney(report.totalDiscount, report.targetCurrency)}
              </dd>
            </div>
          </dl>

          {report.breakdown.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-medium text-zinc-700">By source currency</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-zinc-500">
                    <th className="py-2">Currency</th>
                    <th className="py-2">Count</th>
                    <th className="py-2">Native grand total</th>
                    <th className="py-2">Converted</th>
                  </tr>
                </thead>
                <tbody>
                  {report.breakdown.map((row) => (
                    <tr key={row.currency} className="border-b border-zinc-100">
                      <td className="py-2 uppercase">{row.currency}</td>
                      <td className="py-2">{row.documentCount}</td>
                      <td className="py-2">{formatMoney(row.grandTotal, row.currency)}</td>
                      <td className="py-2">
                        {formatMoney(row.convertedGrandTotal, report.targetCurrency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <AuthGuard>
      <ReportPage />
    </AuthGuard>
  );
}
