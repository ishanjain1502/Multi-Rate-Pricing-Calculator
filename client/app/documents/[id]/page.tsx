// client/app/documents/[id]/page.tsx
"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { StatusPill } from "@/components/documents/StatusPill";
import { getDocument } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { ApiError, type DocumentDetail } from "@/lib/types";

function DocumentView({ id }: { id: string }) {
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDocument(id)
      .then(setDoc)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load document"));
  }, [id]);

  if (error) return <p className="p-6 text-sm text-red-600">{error}</p>;
  if (!doc) return <div className="flex flex-1 items-center justify-center p-8 text-zinc-500">Loading…</div>;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{doc.title}</h1>
          <p className="text-sm text-zinc-500">
            {doc.customer || "No customer"} · {new Date(doc.issueDate).toLocaleDateString()} ·{" "}
            {doc.currency.toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill status={doc.status} />
          {doc.status === "draft" && (
            <button
              onClick={() => router.push(`/documents/${doc.id}/edit`)}
              className="rounded border border-zinc-300 px-4 py-2 text-sm"
            >
              Edit
            </button>
          )}
          <button
            onClick={() => router.push("/documents")}
            className="rounded border border-zinc-300 px-4 py-2 text-sm"
          >
            Back
          </button>
        </div>
      </header>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-zinc-500">
            <th className="py-2 pr-4 font-medium">Description</th>
            <th className="py-2 pr-4 font-medium">Qty</th>
            <th className="py-2 pr-4 font-medium">Unit price</th>
            <th className="py-2 pr-4 font-medium">Discount</th>
            <th className="py-2 pr-4 font-medium">Tax</th>
            <th className="py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {doc.lines.map((line) => (
            <tr key={line.id} className="border-b border-zinc-100">
              <td className="py-2 pr-4">{line.description}</td>
              <td className="py-2 pr-4">{line.quantity}</td>
              <td className="py-2 pr-4">{formatMoney(line.unitPrice, doc.currency)}</td>
              <td className="py-2 pr-4">
                {line.discounts[0]
                  ? line.discounts[0].type === "percent"
                    ? `${line.discounts[0].value}% (−${formatMoney(line.discountAmount, doc.currency)})`
                    : `−${formatMoney(line.discountAmount, doc.currency)}`
                  : "—"}
              </td>
              <td className="py-2 pr-4">
                {line.taxPercent}% ({formatMoney(line.taxAmount, doc.currency)})
              </td>
              <td className="py-2 text-right font-medium">{formatMoney(line.total, doc.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ml-auto w-full max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-zinc-500">Subtotal</dt>
          <dd>{formatMoney(doc.subtotal, doc.currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-zinc-500">Total discount</dt>
          <dd>−{formatMoney(doc.totalDiscount, doc.currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-zinc-500">Total tax</dt>
          <dd>{formatMoney(doc.totalTax, doc.currency)}</dd>
        </div>
        <div className="flex justify-between border-t border-zinc-200 pt-1 text-base font-semibold">
          <dt>Grand total</dt>
          <dd>{formatMoney(doc.grandTotal, doc.currency)}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function DocumentPage({ params }: PageProps<"/documents/[id]">) {
  const { id } = use(params);
  return (
    <AuthGuard>
      <DocumentView id={id} />
    </AuthGuard>
  );
}
