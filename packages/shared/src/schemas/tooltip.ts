import { z } from "zod";

export const tooltipSchema = z.object({
  term: z.string().min(1),
  definition: z.string().min(1),
  analogy: z.string().min(1),
  relatedTerms: z.array(z.string().min(1)),
});

export const tooltipCollectionSchema = z.record(z.string(), tooltipSchema);

export const termParamSchema = z.object({
  term: z.string().min(1).max(100).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
});
