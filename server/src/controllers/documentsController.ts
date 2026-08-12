import type { Response, NextFunction } from "express";
import * as documentService from "../services/documentService.js";
import type { AuthedRequest } from "../middleware/auth.js";

const asyncHandler =
  (fn: (req: AuthedRequest, res: Response) => Promise<void>) =>
  (req: AuthedRequest, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

export const listDocuments = asyncHandler(async (req, res) => {
  const docs = await documentService.listDocuments(
    req.user!.id,
    req.query.status ? { status: req.query.status as any } : undefined,
  );
  res.json(docs);
});

export const createDocument = asyncHandler(async (req, res) => {
  const doc = await documentService.createDocument(req.user!.id, req.body);
  res.status(201).json(doc);
});

export const getDocument = asyncHandler(async (req, res) => {
  const doc = await documentService.getDocument(req.user!.id, req.params.id);
  res.json(doc);
});

export const updateDocument = asyncHandler(async (req, res) => {
  const doc = await documentService.updateDocument(req.user!.id, req.params.id, req.body);
  res.json(doc);
});

export const deleteDocument = asyncHandler(async (req, res) => {
  await documentService.deleteDocument(req.user!.id, req.params.id);
  res.status(204).end();
});

export const finalizeDocument = asyncHandler(async (req, res) => {
  const doc = await documentService.finalizeDocument(req.user!.id, req.params.id);
  res.json(doc);
});

export const addLine = asyncHandler(async (req, res) => {
  const line = await documentService.addLine(req.user!.id, req.params.id, req.body);
  res.status(201).json(line);
});

export const updateLine = asyncHandler(async (req, res) => {
  const line = await documentService.updateLine(
    req.user!.id,
    req.params.id,
    req.params.lineId,
    req.body,
  );
  res.json(line);
});

export const deleteLine = asyncHandler(async (req, res) => {
  await documentService.deleteLine(req.user!.id, req.params.id, req.params.lineId);
  res.status(204).end();
});
