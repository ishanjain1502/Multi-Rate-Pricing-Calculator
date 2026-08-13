// client/lib/api.ts
import {
  ApiError,
  type CreateDocumentBody,
  type DocumentDetail,
  type DocumentSummary,
  type LineBody,
  type LineItem,
  type UpdateDocumentBody,
  type User,
  type ReportSetup,
  type SummaryReport,
  type SummaryReportBody,
} from "./types";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api`;

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message, (data as { details?: unknown })?.details);
  }
  return data as T;
}

type AuthResponse = { user: User; token: string };

export const signup = (email: string, password: string) =>
  apiFetch<AuthResponse>("/auth/signup", { method: "POST", body: { email, password } });

export const login = (email: string, password: string) =>
  apiFetch<AuthResponse>("/auth/login", { method: "POST", body: { email, password } });

export const logout = () => apiFetch<undefined>("/auth/logout", { method: "POST" });

export const fetchMe = () => apiFetch<User>("/auth/me");

export const listDocuments = () => apiFetch<DocumentSummary[]>("/documents");

export const createDocument = (body: CreateDocumentBody) =>
  apiFetch<DocumentSummary>("/documents", { method: "POST", body });

export const getDocument = (id: string) => apiFetch<DocumentDetail>(`/documents/${id}`);

export const updateDocument = (id: string, body: UpdateDocumentBody) =>
  apiFetch<DocumentSummary>(`/documents/${id}`, { method: "PATCH", body });

export const deleteDocument = (id: string) =>
  apiFetch<undefined>(`/documents/${id}`, { method: "DELETE" });

export const finalizeDocument = (id: string) =>
  apiFetch<DocumentSummary>(`/documents/${id}/finalize`, { method: "POST" });

export const addLine = (docId: string, body: LineBody) =>
  apiFetch<LineItem>(`/documents/${docId}/lines`, { method: "POST", body });

export const updateLine = (docId: string, lineId: string, body: Partial<LineBody>) =>
  apiFetch<LineItem>(`/documents/${docId}/lines/${lineId}`, { method: "PATCH", body });

export const deleteLine = (docId: string, lineId: string) =>
  apiFetch<undefined>(`/documents/${docId}/lines/${lineId}`, { method: "DELETE" });

export const getReportSetup = (from: string, to: string, targetCurrency: string) =>
  apiFetch<ReportSetup>(
    `/reports/setup?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&targetCurrency=${encodeURIComponent(targetCurrency)}`,
  );

export const postSummaryReport = (body: SummaryReportBody) =>
  apiFetch<SummaryReport>("/reports/summary", { method: "POST", body });
