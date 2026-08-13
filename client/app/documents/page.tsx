// client/app/documents/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { StatusPill } from "@/components/documents/StatusPill";
import { useAuth } from "@/components/auth/AuthProvider";
import { listDocuments } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { ApiError, type DocumentSummary } from "@/lib/types";

function DocumentList() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDocuments()
      .then(setDocs)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load documents"));
  }, []);

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="text-sm text-zinc-500">{user?.email}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/documents/new")}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white"
          >
            New document
          </button>
          <button onClick={onLogout} className="rounded border border-zinc-300 px-4 py-2 text-sm">
            Log out
          </button>
        </div>
      </header>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {docs === null && !error && <p className="text-zinc-500">Loading…</p>}
      {docs?.length === 0 && (
        <p className="rounded border border-dashed border-zinc-300 p-8 text-center text-zinc-500">
          No documents yet. Click &quot;New document&quot; to create one.
        </p>
      )}

      <ul className="space-y-2">
        {docs?.map((doc) => (
          <li key={doc.id}>
            <button
              onClick={() =>
                router.push(doc.status === "draft" ? `/documents/${doc.id}/edit` : `/documents/${doc.id}`)
              }
              className="flex w-full items-center justify-between gap-4 rounded-lg border border-zinc-200 p-4 text-left hover:border-zinc-400"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{doc.title}</p>
                <p className="truncate text-sm text-zinc-500">
                  {doc.customer || "No customer"} · {new Date(doc.issueDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="font-medium">{formatMoney(doc.grandTotal, doc.currency)}</span>
                <StatusPill status={doc.status} />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <AuthGuard>
      <DocumentList />
    </AuthGuard>
  );
}
