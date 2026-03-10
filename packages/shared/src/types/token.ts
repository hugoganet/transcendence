import type { z } from "zod";
import type {
  tokenBalanceSchema,
  tokenTransactionSchema,
  tokenHistoryQuerySchema,
  paginationMetaSchema,
  tokenTransactionTypeSchema,
} from "../schemas/token.js";

export type TokenBalance = z.infer<typeof tokenBalanceSchema>;
export type TokenTransaction = z.infer<typeof tokenTransactionSchema>;
export type TokenHistoryQuery = z.infer<typeof tokenHistoryQuerySchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
export type TokenTransactionType = z.infer<typeof tokenTransactionTypeSchema>;
