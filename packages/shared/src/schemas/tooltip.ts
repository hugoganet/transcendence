import { z } from "zod";

export const tooltipSchema = z.object({
  term: z.string().min(1),
  definition: z.string().min(1),
  analogy: z.string().min(1),
  relatedTerms: z.array(z.string().min(1)),
});

export const tooltipCollectionSchema = z.record(z.string(), tooltipSchema);
