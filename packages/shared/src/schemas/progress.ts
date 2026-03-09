import { z } from "zod";

export const missionIdParamSchema = z.object({
  missionId: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, "Mission ID must follow X.Y.Z format"),
});

export const missionStatusSchema = z.enum([
  "locked",
  "available",
  "inProgress",
  "completed",
]);

export const chapterStatusSchema = z.enum([
  "locked",
  "available",
  "inProgress",
  "completed",
]);

export const categoryStatusSchema = z.enum([
  "locked",
  "available",
  "inProgress",
  "completed",
]);

export const completeMissionBodySchema = z.object({
  confidenceRating: z.number().int().min(1).max(5).optional(),
});
