// client/components/documents/ConfirmDialog.tsx
"use client";

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-zinc-600">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="rounded border border-zinc-300 px-4 py-2 text-sm">
            Cancel
          </button>
          <button onClick={onConfirm} className="rounded bg-zinc-900 px-4 py-2 text-sm text-white">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
