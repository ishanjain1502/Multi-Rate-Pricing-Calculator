// client/components/documents/TotalsSummary.tsx
import { calcDocumentTotals } from "@/lib/lineCalc";
import { formatMoney } from "@/lib/money";
import { lineToCalcInput, type EditableLine } from "./LineItemForm";

export function TotalsSummary({ lines, currency }: { lines: EditableLine[]; currency: string }) {
  const inputs = lines.map(lineToCalcInput).filter((i) => i !== null);
  const totals = calcDocumentTotals(inputs);

  return (
    <dl className="ml-auto w-full max-w-xs space-y-1 text-sm">
      <div className="flex justify-between">
        <dt className="text-zinc-500">Subtotal</dt>
        <dd>{formatMoney(totals.subtotal, currency)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-zinc-500">Total discount</dt>
        <dd>−{formatMoney(totals.totalDiscount, currency)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-zinc-500">Total tax</dt>
        <dd>{formatMoney(totals.totalTax, currency)}</dd>
      </div>
      <div className="flex justify-between border-t border-zinc-200 pt-1 text-base font-semibold">
        <dt>Grand total</dt>
        <dd>{formatMoney(totals.grandTotal, currency)}</dd>
      </div>
    </dl>
  );
}
