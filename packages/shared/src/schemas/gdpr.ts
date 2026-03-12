import { z } from "zod";

export const gdprExportTokenParamSchema = z.object({
  token: z.string().min(1),
});

export const gdprDeletionTokenParamSchema = z.object({
  token: z.string().min(1),
});
