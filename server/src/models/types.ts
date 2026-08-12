export const DOCUMENT_STATUSES = ["draft", "finalized"] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const DISCOUNT_TYPES = ["percent", "fixed"] as const;

export type DiscountType = (typeof DISCOUNT_TYPES)[number];
