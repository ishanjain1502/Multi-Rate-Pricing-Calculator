// client/components/documents/StatusPill.tsx
import type { DocumentStatus } from "@/lib/types";

export function StatusPill({ status }: { status: DocumentStatus }) {
  const classes =
    status === "draft"
      ? "bg-amber-100 text-amber-800"
      : "bg-green-100 text-green-800";
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${classes}`}>
      {status === "draft" ? "Draft" : "Finalized"}
    </span>
  );
}
