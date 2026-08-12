// src/services/documentService.ts
import mongoose, { type ClientSession, type HydratedDocument } from "mongoose";
import { Document, LineItem, type IDocument, type ILineItem } from "../models/index.js";
import { calculateDocument, calculateLineItem, type LineItemInput } from "../calculations/index.js";
import { NotFoundError, ConflictError } from "../errors/HttpError.js";

type DocumentDoc = HydratedDocument<IDocument>;
type LineItemDoc = HydratedDocument<ILineItem>;

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

export type DocumentWithLinesDTO = DocumentDTO & { lines: LineDTO[] };

export function lineToDTO(line: LineItemDoc): LineDTO {
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

export function documentToDTO(doc: DocumentDoc): DocumentDTO {
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

function lineFieldsToLineItemInput(fields: {
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  discounts?: { type: "percent" | "fixed"; value: number }[];
}): LineItemInput {
  return {
    quantity: fields.quantity,
    unitPrice: fields.unitPrice,
    discount: fields.discounts?.[0]
      ? { type: fields.discounts[0].type, value: fields.discounts[0].value }
      : undefined,
    taxPercent: fields.taxPercent,
  };
}

export function toLineItemInput(line: LineItemDoc): LineItemInput {
  return lineFieldsToLineItemInput(line);
}

export async function loadOwnedDocument(
  documentId: string,
  userId: string,
  session?: ClientSession,
): Promise<DocumentDoc> {
  const doc = await Document.findOne({ _id: documentId, userId }).session(session ?? null);
  if (!doc) throw new NotFoundError("Document not found");
  return doc;
}

export function assertDraft(doc: DocumentDoc): void {
  if (doc.status !== "draft") {
    throw new ConflictError("Finalized documents cannot be modified");
  }
}

export async function recomputeTotals(doc: DocumentDoc, session?: ClientSession): Promise<void> {
  const lines = await LineItem.find({ documentId: doc._id })
    .sort({ createdAt: 1 })
    .session(session ?? null);
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
): Promise<DocumentDTO[]> {
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

export async function addLine(userId: string, documentId: string, input: CreateLineInput): Promise<LineDTO> {
  return mongoose.connection.transaction(async (session) => {
    const doc = await loadOwnedDocument(documentId, userId, session);
    assertDraft(doc);

    const calc = calculateLineItem(lineFieldsToLineItemInput(input));

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
    const doc = await loadOwnedDocument(documentId, userId, session);
    assertDraft(doc);

    const line = await LineItem.findOne({ _id: lineId, documentId: doc._id }).session(session);
    if (!line) throw new NotFoundError("Line item not found");

    if (input.description !== undefined) line.description = input.description;
    if (input.quantity !== undefined) line.quantity = input.quantity;
    if (input.unitPrice !== undefined) line.unitPrice = input.unitPrice;
    if (input.taxPercent !== undefined) line.taxPercent = input.taxPercent;
    if (input.discounts !== undefined) line.set("discounts", input.discounts);

    const calc = calculateLineItem(toLineItemInput(line));
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
    const doc = await loadOwnedDocument(documentId, userId, session);
    assertDraft(doc);

    const res = await LineItem.deleteOne({ _id: lineId, documentId: doc._id }).session(session);
    if (res.deletedCount === 0) throw new NotFoundError("Line item not found");

    await recomputeTotals(doc, session);
    await doc.save({ session });
  });
}

type UpdateDocumentInput = {
  title?: string;
  customer?: string;
  issueDate?: Date;
  currency?: string;
};

export async function updateDocument(userId: string, documentId: string, input: UpdateDocumentInput): Promise<DocumentDTO> {
  const doc = await loadOwnedDocument(documentId, userId);
  assertDraft(doc);

  if (input.title !== undefined) doc.title = input.title;
  if (input.customer !== undefined) doc.customer = input.customer;
  if (input.issueDate !== undefined) doc.issueDate = input.issueDate;
  if (input.currency !== undefined) doc.currency = input.currency;
  await doc.save();

  return documentToDTO(doc);
}

export async function deleteDocument(userId: string, documentId: string): Promise<void> {
  await mongoose.connection.transaction(async (session) => {
    const doc = await loadOwnedDocument(documentId, userId, session);
    assertDraft(doc);
    await LineItem.deleteMany({ documentId: doc._id }).session(session);
    await Document.deleteOne({ _id: doc._id }).session(session);
  });
}

export async function finalizeDocument(userId: string, documentId: string): Promise<DocumentDTO> {
  return mongoose.connection.transaction(async (session) => {
    const doc = await loadOwnedDocument(documentId, userId, session);
    assertDraft(doc);

    await recomputeTotals(doc, session);
    doc.status = "finalized";
    await doc.save({ session });

    return documentToDTO(doc);
  });
}
