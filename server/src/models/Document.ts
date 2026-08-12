import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import { DOCUMENT_STATUSES } from "./types.js";

const documentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    customer: {
      type: String,
      trim: true,
      default: "",
    },
    issueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: DOCUMENT_STATUSES,
      default: "draft",
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalDiscount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalTax: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      default: "usd",
    },
  },
  { timestamps: true },
);

export type IDocument = InferSchemaType<typeof documentSchema> & {
  _id: Types.ObjectId;
};

export const Document = model("Document", documentSchema);
