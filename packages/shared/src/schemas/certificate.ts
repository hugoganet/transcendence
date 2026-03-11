import { z } from "zod";

export const certificateSchema = z.object({
  id: z.string(),
  displayName: z.string().nullable(),
  completionDate: z.string().datetime(),
  curriculumTitle: z.string(),
  shareToken: z.string(),
  totalMissions: z.number().int(),
  totalCategories: z.number().int(),
});

export const publicCertificateSchema = certificateSchema.omit({ id: true });

export const shareTokenParamSchema = z.object({
  shareToken: z.string().min(1),
});

export const certificateShareResponseSchema = z.object({
  shareUrl: z.string().url(),
});
