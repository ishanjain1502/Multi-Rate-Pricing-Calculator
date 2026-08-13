"use client";

import { use } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DocumentEditor } from "@/components/documents/DocumentEditor";

export default function EditDocumentPage({ params }: PageProps<"/documents/[id]/edit">) {
  const { id } = use(params);
  return (
    <AuthGuard>
      <DocumentEditor mode="edit" documentId={id} />
    </AuthGuard>
  );
}
