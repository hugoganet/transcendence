import { z } from "zod";
import { MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE } from "../constants/tokens.js";

export const tokenTransactionTypeSchema = z.enum(["EARN", "GAS_SPEND"]);

export const tokenBalanceSchema = z.object({
  tokenBalance: z.number().int(),
  totalEarned: z.number().int().min(0),
  totalSpent: z.number().int().min(0),
  lastEarned: z.string().nullable(),
});

export const tokenTransactionSchema = z.object({
  id: z.string(),
  amount: z.number().int(),
  type: tokenTransactionTypeSchema,
  missionId: z.string().nullable(),
  exerciseId: z.string().nullable(),
  description: z.string(),
  createdAt: z.string(),
});

export const tokenHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export const paginationMetaSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
});
