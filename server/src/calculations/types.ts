export const WARNING_CODES = {
  DISCOUNT_CLAMPED: "DISCOUNT_CLAMPED",
} as const;

export type WarningCode = (typeof WARNING_CODES)[keyof typeof WARNING_CODES];

export type DiscountType = "percent" | "fixed";

export type CalculationWarning = {
  code: WarningCode;
  message: string;
  lineIndex?: number;
};

export type LineItemDiscount = {
  type: DiscountType;
  value: number;
};

export type LineItemInput = {
  quantity: number;
  unitPrice: number;
  discount?: LineItemDiscount;
  taxPercent: number;
};

export type CalculatedLineItem = {
  subtotal: number;
  discountAmount: number;
  discountedAmount: number;
  taxAmount: number;
  total: number;
  warnings: CalculationWarning[];
};

export type DocumentTotals = {
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
};

export type CalculatedDocument = DocumentTotals & {
  lines: CalculatedLineItem[];
  warnings: CalculationWarning[];
};
