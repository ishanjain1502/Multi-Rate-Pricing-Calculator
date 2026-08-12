import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import { DISCOUNT_TYPES } from "./types.js";

const discountSchema = new Schema(
  {
    type: {
      type: String,
      enum: DISCOUNT_TYPES,
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const lineItemSchema = new Schema(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discounts: {
      type: [discountSchema],
      default: [],
    },
    taxPercent: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    discountedAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

export type ILineItemDiscount = InferSchemaType<typeof discountSchema>;
export type ILineItem = InferSchemaType<typeof lineItemSchema> & {
  _id: Types.ObjectId;
};

export const LineItem = model("LineItem", lineItemSchema);
