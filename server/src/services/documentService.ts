// src/services/documentService.ts
import mongoose, { type ClientSession } from "mongoose";
import { Document, LineItem, type IDocument, type ILineItem } from "../models/index.js";
import { calculateDocument, calculateLineItem, type LineItemInput } from "../calculations/index.js";
import { NotFoundError, ConflictError } from "../errors/HttpError.js";

export type LineDTO = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discounts: { type: "percent" | "fixed"; value: number }[];
  taxPercent: number;
  subtotal: number;
  discountAmount: number;
  discountedAmount: number;
  taxAmount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
};

export type DocumentDTO = {
  id: string;
  title: string;
  customer: string;
  issueDate: string;
  status: "draft" | "finalized";
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentSummaryDTO = Omit<DocumentDTO, "customer" | "issueDate"> & {
  customer: string;
  issueDate: string;
};

export type DocumentWithLinesDTO = DocumentDTO & { lines: LineDTO[] };

export function lineToDTO(line: ILineItem): LineDTO {
  return {
    id: line._id.toString(),
    description: line.description,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    discounts: line.discounts.map((d) => ({ type: d.type, value: d.value })),
    taxPercent: line.taxPercent,
    subtotal: line.subtotal,
    discountAmount: line.discountAmount,
    discountedAmount: line.discountedAmount,
    taxAmount: line.taxAmount,
    total: line.total,
    createdAt: line.createdAt.toISOString(),
    updatedAt: line.updatedAt.toISOString(),
  };
}

export function documentToDTO(doc: IDocument): DocumentDTO {
  return {
    id: doc._id.toString(),
    title: doc.title,
    customer: doc.customer ?? "",
    issueDate: doc.issueDate.toISOString(),
    status: doc.status,
    subtotal: doc.subtotal,
    totalDiscount: doc.totalDiscount,
    totalTax: doc.totalTax,
    grandTotal: doc.grandTotal,
    currency: doc.currency,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toLineItemInput(line: ILineItem): LineItemInput {
  return {
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    discount: line.discounts[0] ? { type: line.discounts[0].type, value: line.discounts[0].value } : undefined,
    taxPercent: line.taxPercent,
  };
}

export async function loadOwnedDocument(documentId: string, userId: string): Promise<IDocument> {
  const doc = await Document.findOne({ _id: documentId, userId });
  if (!doc) throw new NotFoundError("Document not found");
  return doc;
}

export function assertDraft(doc: IDocument): void {
  if (doc.status !== "draft") {
    throw new ConflictError("Finalized documents cannot be modified");
  }
}

export async function recomputeTotals(doc: IDocument, session?: ClientSession): Promise<void> {
  const lines = await LineItem.find({ documentId: doc._id }).sort({ createdAt: 1 }).session(session);
  const totals = calculateDocument(lines.map(toLineItemInput));
  doc.subtotal = totals.subtotal;
  doc.totalDiscount = totals.totalDiscount;
  doc.totalTax = totals.totalTax;
  doc.grandTotal = totals.grandTotal;
}

export async function createDocument(
  userId: string,
  input: { title: string; customer?: string; issueDate: Date; currency: string },
): Promise<DocumentDTO> {
  const doc = await Document.create({
    userId,
    title: input.title,
    customer: input.customer ?? "",
    issueDate: input.issueDate,
    currency: input.currency,
    status: "draft",
    subtotal: 0,
    totalDiscount: 0,
    totalTax: 0,
    grandTotal: 0,
  });
  return documentToDTO(doc);
}

export async function listDocuments(
  userId: string,
  filter?: { status?: "draft" | "finalized" },
): Promise<DocumentSummaryDTO[]> {
  const query: Record<string, unknown> = { userId };
  if (filter?.status) query.status = filter.status;
  const docs = await Document.find(query).sort({ createdAt: -1 });
  return docs.map(documentToDTO);
}

export async function getDocument(userId: string, documentId: string): Promise<DocumentWithLinesDTO> {
  const doc = await loadOwnedDocument(documentId, userId);
  const lines = await LineItem.find({ documentId: doc._id }).sort({ createdAt: 1 });
  return { ...documentToDTO(doc), lines: lines.map(lineToDTO) };
}

type CreateLineInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  discounts?: { type: "percent" | "fixed"; value: number }[];
  taxPercent: number;
};

type UpdateLineInput = Partial<CreateLineInput>;

function calcLineTotals(input: LineItemInput) {
  return calculateLineItem(input);
}

export async function addLine(userId: string, documentId: string, input: CreateLineInput): Promise<LineDTO> {
  return mongoose.connection.transaction(async (session) => {
    const doc = await loadOwnedDocument(documentId, userId);
    assertDraft(doc);

    const lineInput: LineItemInput = {
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      discount: input.discounts?.[0] ? { type: input.discounts[0].type, value: input.discounts[0].value } : undefined,
      taxPercent: input.taxPercent,
    };
    const calc = calcLineTotals(lineInput);

    const line = await LineItem.create(
      [
        {
          documentId: doc._id,
          description: input.description,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
          discounts: input.discounts ?? [],
          taxPercent: input.taxPercent,
          subtotal: calc.subtotal,
          discountAmount: calc.discountAmount,
          discountedAmount: calc.discountedAmount,
          taxAmount: calc.taxAmount,
          total: calc.total,
        },
      ],
      { session },
    );

    await recomputeTotals(doc, session);
    await doc.save({ session });

    return lineToDTO(line[0]);
  });
}

export async function updateLine(
  userId: string,
  documentId: string,
  lineId: string,
  input: UpdateLineInput,
): Promise<LineDTO> {
  return mongoose.connection.transaction(async (session) => {
    const doc = await loadOwnedDocument(documentId, userId);
    assertDraft(doc);

    const line = await LineItem.findOne({ _id: lineId, documentId: doc._id }).session(session);
    if (!line) throw new NotFoundError("Line item not found");

    if (input.description !== undefined) line.description = input.description;
    if (input.quantity !== undefined) line.quantity = input.quantity;
    if (input.unitPrice !== undefined) line.unitPrice = input.unitPrice;
    if (input.taxPercent !== undefined) line.taxPercent = input.taxPercent;
    if (input.discounts !== undefined) line.discounts = input.discounts;

    const calc = calcLineTotals(toLineItemInput(line));
    line.subtotal = calc.subtotal;
    line.discountAmount = calc.discountAmount;
    line.discountedAmount = calc.discountedAmount;
    line.taxAmount = calc.taxAmount;
    line.total = calc.total;
    await line.save({ session });

    await recomputeTotals(doc, session);
    await doc.save({ session });

    return lineToDTO(line);
  });
}

export async function deleteLine(userId: string, documentId: string, lineId: string): Promise<void> {
  await mongoose.connection.transaction(async (session) => {
    const doc = await loadOwnedDocument(documentId, userId);
    assertDraft(doc);

    const res = await LineItem.deleteOne({ _id: lineId, documentId: doc._id }).session(session);
    if (res.deletedCount === 0) throw new NotFoundError("Line item not found");

    await recomputeTotals(doc, session);
    await doc.save({ session });
  });
}
