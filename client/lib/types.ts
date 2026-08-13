// client/lib/types.ts
export type User = { id: string; email: string };

export type DocumentStatus = "draft" | "finalized";

export type Discount = { type: "percent" | "fixed"; value: number };

export type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number; // cents
  discounts: Discount[];
  taxPercent: number;
  subtotal: number;
  discountAmount: number;
  discountedAmount: number;
  taxAmount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
};

export type DocumentSummary = {
  id: string;
  title: string;
  customer: string;
  issueDate: string; // ISO
  status: DocumentStatus;
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentDetail = DocumentSummary & { lines: LineItem[] };

export type CreateDocumentBody = {
  title: string;
  customer?: string;
  issueDate: string; // "yyyy-mm-dd"
  currency: string;
};

export type UpdateDocumentBody = Partial<CreateDocumentBody>;

export type LineBody = {
  description: string;
  quantity: number;
  unitPrice: number; // cents
  discounts?: Discount[];
  taxPercent: number;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ReportSetup = {
  from: string;
  to: string;
  targetCurrency: string;
  currencies: string[];
  defaultRates: Record<string, number>;
};

export type SummaryReport = {
  from: string;
  to: string;
  targetCurrency: string;
  documentCount: number;
  grandTotal: number;
  totalTax: number;
  totalDiscount: number;
  breakdown: Array<{
    currency: string;
    documentCount: number;
    grandTotal: number;
    totalTax: number;
    totalDiscount: number;
    convertedGrandTotal: number;
    convertedTotalTax: number;
    convertedTotalDiscount: number;
  }>;
};

export type SummaryReportBody = {
  from: string;
  to: string;
  targetCurrency: string;
  rates: Record<string, number>;
};
