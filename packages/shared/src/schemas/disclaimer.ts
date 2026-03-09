import { z } from "zod";

export const moduleIdParamSchema = z.object({
  moduleId: z
    .string()
    .min(1)
    .regex(/^\d+\.\d+$/, "Module ID must be in format X.Y"),
});
