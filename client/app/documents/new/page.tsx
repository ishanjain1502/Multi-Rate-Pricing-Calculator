import { AuthGuard } from "@/components/auth/AuthGuard";
import { DocumentEditor } from "@/components/documents/DocumentEditor";

export default function NewDocumentPage() {
  return (
    <AuthGuard>
      <DocumentEditor mode="create" />
    </AuthGuard>
  );
}
