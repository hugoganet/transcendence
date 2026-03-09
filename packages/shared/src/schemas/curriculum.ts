import { z } from "zod";

export const exerciseTypeSchema = z.enum(["IP", "CM", "ST", "SI"]);

export const progressiveRevealMechanicSchema = z.enum([
  "tokensRevealed",
  "walletRevealed",
  "gasRevealed",
  "dashboardRevealed",
]);

export const progressiveRevealSchema = z.object({
  mechanic: progressiveRevealMechanicSchema,
  description: z.string().min(1),
});

export const missionSchema = z.object({
  id: z.string().regex(/^\d+\.\d+\.\d+$/, "Mission ID must follow {cat}.{chap}.{mission} format"),
  order: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().min(1),
  exerciseType: exerciseTypeSchema,
  estimatedMinutes: z.number().int().min(2).max(5),
  lastReviewedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO 8601 date format (YYYY-MM-DD)"),
  progressiveReveal: progressiveRevealSchema.nullable(),
});

export const chapterSchema = z.object({
  id: z.string().regex(/^\d+\.\d+$/, "Chapter ID must follow {cat}.{chap} format"),
  order: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().min(1),
  disclaimerRequired: z.boolean(),
  missions: z.array(missionSchema).min(1),
});

export const categorySchema = z.object({
  id: z.string().regex(/^\d+$/, "Category ID must be a number"),
  order: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().min(1),
  platformMechanic: z.string().min(1),
  chapters: z.array(chapterSchema).min(1),
});

export const curriculumStructureSchema = z.array(categorySchema).min(1);
