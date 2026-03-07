import { z } from "zod";

export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    message: z.string().optional(),
  });

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  statusCode: z.number(),
});
