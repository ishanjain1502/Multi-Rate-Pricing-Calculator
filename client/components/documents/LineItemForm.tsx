// client/components/documents/LineItemForm.tsx
"use client";

import { useState } from "react";
import { dollarsToCents, formatMoney } from "@/lib/money";
import { calcLine, type LineCalcInput } from "@/lib/lineCalc";

export type EditableLine = {
  clientKey: string;
  id?: string; // server id once persisted
  description: string;
  quantity: string;
  unitPrice: string; // dollars
  discountType: "none" | "percent" | "fixed";
  discountValue: string; // percent, or dollars when fixed
  taxPercent: string;
};

export function lineToCalcInput(line: EditableLine): LineCalcInput | null {
  const quantity = Number(line.quantity);
  const unitPrice = dollarsToCents(line.unitPrice);
  const taxPercent = Number(line.taxPercent);
  if (!line.description.trim()) return null;
  if (!Number.isInteger(quantity) || quantity < 1) return null;
  if (unitPrice === null) return null;
  if (!Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 100) return null;

  let discount: LineCalcInput["discount"];
  if (line.discountType === "percent") {
    const value = Number(line.discountValue);
    if (!Number.isFinite(value) || value < 0) return null;
    discount = { type: "percent", value };
  } else if (line.discountType === "fixed") {
    const value = dollarsToCents(line.discountValue);
    if (value === null) return null;
    discount = { type: "fixed", value };
  }

  return { quantity, unitPrice, discount, taxPercent };
}

export function LineItemForm({
  line,
  currency,
  onSave,
  onCancel,
}: {
  line: EditableLine;
  currency: string;
  onSave: (line: EditableLine) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<EditableLine>(line);
  const calcInput = lineToCalcInput(draft);
  const calc = calcInput ? calcLine(calcInput) : null;

  const set = (patch: Partial<EditableLine>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <div className="space-y-3 rounded-lg border border-zinc-300 bg-zinc-50 p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="col-span-2 block text-sm sm:col-span-3">
          Description
          <input
            value={draft.description}
            onChange={(e) => set({ description: e.target.value })}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            placeholder="Widget A"
          />
        </label>
        <label className="block text-sm">
          Quantity
          <input
            value={draft.quantity}
            onChange={(e) => set({ quantity: e.target.value })}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            inputMode="numeric"
            placeholder="1"
          />
        </label>
        <label className="block text-sm">
          Unit price
          <input
            value={draft.unitPrice}
            onChange={(e) => set({ unitPrice: e.target.value })}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            inputMode="decimal"
            placeholder="100.00"
          />
        </label>
        <label className="block text-sm">
          Tax %
          <input
            value={draft.taxPercent}
            onChange={(e) => set({ taxPercent: e.target.value })}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            inputMode="decimal"
            placeholder="5"
          />
        </label>
        <label className="block text-sm">
          Discount
          <select
            value={draft.discountType}
            onChange={(e) => set({ discountType: e.target.value as EditableLine["discountType"] })}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
          >
            <option value="none">None</option>
            <option value="percent">Percent</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </label>
        {draft.discountType !== "none" && (
          <label className="block text-sm">
            {draft.discountType === "percent" ? "Discount %" : "Discount amount"}
            <input
              value={draft.discountValue}
              onChange={(e) => set({ discountValue: e.target.value })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
              inputMode="decimal"
              placeholder={draft.discountType === "percent" ? "10" : "20.00"}
            />
          </label>
        )}
      </div>

      {calc && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-600">
          <span>Subtotal {formatMoney(calc.subtotal, currency)}</span>
          <span>Discount −{formatMoney(calc.discountAmount, currency)}</span>
          <span>Tax {formatMoney(calc.taxAmount, currency)}</span>
          <span className="font-medium text-zinc-900">Total {formatMoney(calc.total, currency)}</span>
          {calc.clamped && <span className="text-amber-700">Discount was capped</span>}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => calcInput && onSave(draft)}
          disabled={!calcInput}
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Done
        </button>
        <button onClick={onCancel} className="rounded border border-zinc-300 px-4 py-2 text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}
