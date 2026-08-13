// client/components/documents/DocumentEditor.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";
import { CURRENCIES, formatMoney } from "@/lib/money";
import { calcLine } from "@/lib/lineCalc";
import { ApiError, type DocumentDetail, type LineBody, type LineItem } from "@/lib/types";
import { LineItemForm, lineToCalcInput, type EditableLine } from "./LineItemForm";
import { TotalsSummary } from "./TotalsSummary";
import { ConfirmDialog } from "./ConfirmDialog";

let nextKey = 1;
const freshKey = () => `new-${nextKey++}`;

function blankLine(): EditableLine {
  return {
    clientKey: freshKey(),
    description: "",
    quantity: "1",
    unitPrice: "",
    discountType: "none",
    discountValue: "",
    taxPercent: "0",
  };
}

function fromServerLine(line: LineItem): EditableLine {
  const discount = line.discounts[0];
  return {
    clientKey: line.id,
    id: line.id,
    description: line.description,
    quantity: String(line.quantity),
    unitPrice: (line.unitPrice / 100).toFixed(2),
    discountType: discount?.type ?? "none",
    discountValue: discount
      ? discount.type === "percent"
        ? String(discount.value)
        : (discount.value / 100).toFixed(2)
      : "",
    taxPercent: String(line.taxPercent),
  };
}

function toLineBody(line: EditableLine): LineBody | null {
  const input = lineToCalcInput(line);
  if (!input) return null;
  return {
    description: line.description.trim(),
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    discounts: input.discount ? [input.discount] : [],
    taxPercent: input.taxPercent,
  };
}

function sameBody(a: LineBody, b: LineBody): boolean {
  return (
    a.description === b.description &&
    a.quantity === b.quantity &&
    a.unitPrice === b.unitPrice &&
    a.taxPercent === b.taxPercent &&
    (a.discounts?.[0]?.type ?? null) === (b.discounts?.[0]?.type ?? null) &&
    (a.discounts?.[0]?.value ?? null) === (b.discounts?.[0]?.value ?? null)
  );
}

export function DocumentEditor(
  props: { mode: "create" } | { mode: "edit"; documentId: string },
) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [customer, setCustomer] = useState("");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [currency, setCurrency] = useState("usd");
  const [lines, setLines] = useState<EditableLine[]>([]);
  const [confirmedKeys, setConfirmedKeys] = useState<Set<string>>(new Set());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [serverLines, setServerLines] = useState<LineItem[]>([]);
  const [status, setStatus] = useState<"draft" | "finalized">("draft");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState<"finalize" | "delete" | null>(null);
  const [acting, setActing] = useState(false);
  const [loaded, setLoaded] = useState(props.mode === "create");

  useEffect(() => {
    if (props.mode !== "edit") return;
    api
      .getDocument(props.documentId)
      .then((doc: DocumentDetail) => {
        if (doc.status === "finalized") {
          router.replace(`/documents/${doc.id}`);
          return;
        }
        setTitle(doc.title);
        setCustomer(doc.customer);
        setIssueDate(doc.issueDate.slice(0, 10));
        setCurrency(doc.currency);
        setStatus(doc.status);
        setServerLines(doc.lines);
        setLines(doc.lines.map(fromServerLine));
        setConfirmedKeys(new Set(doc.lines.map((l) => l.id)));
        setLoaded(true);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load document"),
      );
  }, [props, router]);

  function confirmLine(line: EditableLine) {
    setLines((prev) => prev.map((l) => (l.clientKey === line.clientKey ? line : l)));
    setConfirmedKeys((prev) => new Set(prev).add(line.clientKey));
    setEditingKey(null);
  }

  function cancelEdit(line: EditableLine) {
    if (!confirmedKeys.has(line.clientKey)) {
      setLines((prev) => prev.filter((l) => l.clientKey !== line.clientKey));
    } else if (line.id) {
      const original = serverLines.find((l) => l.id === line.id);
      if (original) {
        setLines((prev) => prev.map((l) => (l.clientKey === line.clientKey ? fromServerLine(original) : l)));
      }
    }
    setEditingKey(null);
  }

  function removeLine(clientKey: string) {
    setLines((prev) => prev.filter((l) => l.clientKey !== clientKey));
    setConfirmedKeys((prev) => {
      const next = new Set(prev);
      next.delete(clientKey);
      return next;
    });
  }

  async function onSave() {
    setError(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (editingKey) {
      setError("Finish editing the open line item first");
      return;
    }
    const bodies = lines.map(toLineBody);
    if (bodies.some((b) => b === null)) {
      setError("Every line needs a description, quantity ≥ 1, a valid unit price, and tax 0–100");
      return;
    }
    setSaving(true);
    try {
      const docFields = {
        title: title.trim(),
        customer: customer.trim() || undefined,
        issueDate,
        currency: currency.trim().toLowerCase(),
      };

      let docId: string;
      if (props.mode === "create") {
        const doc = await api.createDocument(docFields);
        docId = doc.id;
        for (const body of bodies as LineBody[]) {
          await api.addLine(docId, body);
        }
        router.replace(`/documents/${docId}`);
        return;
      }

      docId = props.documentId;
      await api.updateDocument(docId, docFields);

      const removed = serverLines.filter((sl) => !lines.some((l) => l.id === sl.id));
      for (const line of removed) await api.deleteLine(docId, line.id);

      for (const [i, line] of lines.entries()) {
        const body = bodies[i] as LineBody;
        if (!line.id) {
          await api.addLine(docId, body);
        } else {
          const original = serverLines.find((sl) => sl.id === line.id);
          const originalBody: LineBody = {
            description: original!.description,
            quantity: original!.quantity,
            unitPrice: original!.unitPrice,
            discounts: original!.discounts,
            taxPercent: original!.taxPercent,
          };
          if (!sameBody(body, originalBody)) await api.updateLine(docId, line.id, body);
        }
      }

      const fresh = await api.getDocument(docId);
      setServerLines(fresh.lines);
      setLines(fresh.lines.map(fromServerLine));
      setConfirmedKeys(new Set(fresh.lines.map((l) => l.id)));
      router.push(`/documents/${docId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onFinalize() {
    if (props.mode !== "edit") return;
    setActing(true);
    setError(null);
    try {
      await api.finalizeDocument(props.documentId);
      router.push(`/documents/${props.documentId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Finalize failed");
    } finally {
      setActing(false);
      setConfirming(null);
    }
  }

  async function onDelete() {
    if (props.mode !== "edit") return;
    setActing(true);
    setError(null);
    try {
      await api.deleteDocument(props.documentId);
      router.push("/documents");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setActing(false);
      setConfirming(null);
    }
  }

  if (!loaded) {
    return <div className="flex flex-1 items-center justify-center p-8 text-zinc-500">Loading…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">
        {props.mode === "create" ? "New document" : "Edit document"}
      </h1>

      <section className="grid grid-cols-2 gap-3">
        <label className="col-span-2 block text-sm">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            placeholder="Invoice #1"
          />
        </label>
        <label className="block text-sm">
          Customer
          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Issue date
          <input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Currency
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code.toUpperCase()} — {c.label}
              </option>
            ))}
            {!CURRENCIES.some((c) => c.code === currency) && (
              <option value={currency}>{currency.toUpperCase()}</option>
            )}
          </select>
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Line items</h2>
        {lines.map((line) =>
          editingKey === line.clientKey ? (
            <LineItemForm
              key={line.clientKey}
              line={line}
              currency={currency}
              onSave={confirmLine}
              onCancel={() => cancelEdit(line)}
            />
          ) : (
            <div
              key={line.clientKey}
              className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{line.description || "Untitled line"}</p>
                <p className="text-sm text-zinc-500">
                  {line.quantity} × {line.unitPrice || "0.00"}
                  {line.discountType !== "none" &&
                    ` · ${line.discountType === "percent" ? `${line.discountValue}% off` : `${line.discountValue} off`}`}
                  {` · ${line.taxPercent}% tax`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-medium">
                  {(() => {
                    const input = lineToCalcInput(line);
                    return input ? formatMoney(calcLine(input).total, currency) : "—";
                  })()}
                </span>
                <button
                  onClick={() => setEditingKey(line.clientKey)}
                  className="rounded border border-zinc-300 px-3 py-1 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => removeLine(line.clientKey)}
                  className="rounded border border-red-300 px-3 py-1 text-sm text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ),
        )}
        <button
          onClick={() => {
            const line = blankLine();
            setLines((prev) => [...prev, line]);
            setEditingKey(line.clientKey);
          }}
          disabled={editingKey !== null}
          className="rounded border border-dashed border-zinc-400 px-4 py-2 text-sm text-zinc-700 disabled:opacity-50"
        >
          + Add line item
        </button>
      </section>

      <TotalsSummary lines={lines} currency={currency} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded bg-zinc-900 px-6 py-2 text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => router.push("/documents")}
          className="rounded border border-zinc-300 px-6 py-2"
        >
          Cancel
        </button>
        {props.mode === "edit" && status === "draft" && (
          <>
            <button
              onClick={() => setConfirming("finalize")}
              disabled={acting}
              className="rounded border border-green-600 px-6 py-2 text-green-700 disabled:opacity-50"
            >
              Finalize
            </button>
            <button
              onClick={() => setConfirming("delete")}
              disabled={acting}
              className="rounded border border-red-600 px-6 py-2 text-red-700 disabled:opacity-50"
            >
              Delete
            </button>
          </>
        )}
      </div>

      {confirming === "finalize" && (
        <ConfirmDialog
          title="Finalize document?"
          message="Finalized documents cannot be edited or deleted. This cannot be undone."
          confirmLabel="Finalize"
          onConfirm={onFinalize}
          onCancel={() => setConfirming(null)}
        />
      )}
      {confirming === "delete" && (
        <ConfirmDialog
          title="Delete document?"
          message="This draft and all its line items will be permanently deleted."
          confirmLabel="Delete"
          onConfirm={onDelete}
          onCancel={() => setConfirming(null)}
        />
      )}
    </div>
  );
}
